<?php

namespace CeresCoconutMTG\Helpers;

/**
 * Class TrackingNormalizer
 *
 * Bringt die Antworten der Paketdienst-APIs (UPS, DHL) in ein gemeinsames Format.
 * Die Sendungsverfolgungsseite kennt nur dieses Format, damit der Kunde keinen
 * Unterschied zwischen den Paketdiensten sieht.
 *
 * Bewusst ohne Plenty-Abhaengigkeiten, damit die Zuordnung der Statuscodes an einer
 * Stelle steht und sich mit gespeicherten API-Antworten nachvollziehen laesst.
 *
 * @package CeresCoconutMTG\Helpers
 */
class TrackingNormalizer
{
    /** Stufen der Fortschrittsanzeige, aufsteigend. */
    const STAGE_ORDERED = 0;
    const STAGE_PACKED = 1;
    const STAGE_IN_TRANSIT = 2;
    const STAGE_OUT_FOR_DELIVERY = 3;
    const STAGE_DELIVERED = 4;

    /** Zustand eines Pakets neben der Stufe. */
    const STATE_OK = 'ok';
    const STATE_PROBLEM = 'problem';
    const STATE_RETURNED = 'returned';
    const STATE_NO_DATA = 'noData';

    const CARRIER_UPS = 'ups';
    const CARRIER_DHL = 'dhl';
    const CARRIER_UNKNOWN = 'unknown';

    const CARRIER_NAMES = [
        self::CARRIER_UPS => 'UPS',
        self::CARRIER_DHL => 'DHL',
        self::CARRIER_UNKNOWN => 'Paketdienst'
    ];

    /** UPS-Aktivitaetscodes fuer "Wird heute zugestellt" (statusCode 021). */
    const UPS_OUT_FOR_DELIVERY_CODES = ['OF', 'OT'];
    const UPS_OUT_FOR_DELIVERY_STATUS = '021';

    /**
     * DHL kennt in der Unified API keinen eigenen Code fuer "In Zustellung". Das
     * Ereignis ist ein normales "transit" und nur am Text zu erkennen.
     */
    const DHL_OUT_FOR_DELIVERY_PATTERN = '/zustellfahrzeug|in zustellung|wird heute zugestellt|out for delivery/i';
    const DHL_RETURNED_PATTERN = '/r(ü|ue)cksendung|zur(ü|ue)ckgesendet|an den absender zur(ü|ue)ck|returned to sender/i';

    const WEEKDAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

    /** Fuer upperFirst(): strtoupper wandelt nur ASCII um. */
    const UPPER_UMLAUTS = ['ä' => 'Ä', 'ö' => 'Ö', 'ü' => 'Ü'];

    /** @var string Heutiges Datum (Y-m-d) fuer "heute"/"morgen"-Beschriftungen. */
    private $today;

    /**
     * @param string|null $today Y-m-d, nur fuer Tests ueberschreiben
     */
    public function __construct(string $today = null)
    {
        $this->today = $today ?: date('Y-m-d');
    }

    /**
     * Grundgeruest eines Pakets, solange vom Paketdienst noch keine Daten vorliegen.
     *
     * @param string $number
     * @param string $carrier
     * @return array
     */
    public function emptyPackage(string $number, string $carrier): array
    {
        return [
            'number' => $number,
            'carrier' => $carrier,
            'carrierName' => self::CARRIER_NAMES[$carrier] ?? self::CARRIER_NAMES[self::CARRIER_UNKNOWN],
            'carrierUrl' => $this->carrierUrl($carrier, $number),
            'stage' => self::STAGE_PACKED,
            'state' => self::STATE_NO_DATA,
            'error' => false,
            'message' => '',
            // ['date' => 'Y-m-d', 'from' => 'H:i', 'to' => 'H:i']
            'estimated' => null,
            // ['date' => 'Y-m-d', 'time' => 'H:i']
            'deliveredAt' => null,
            'deliveryLocation' => '',
            'events' => []
        ];
    }

    /**
     * Antwort der UPS Tracking API (GET /api/track/v1/details/{nummer}) umwandeln.
     *
     * Aufbau: trackResponse.shipment[0].package[0] mit activity[] (neueste zuerst),
     * deliveryDate[] und deliveryTime. Unbekannte Nummern kommen als HTTP 200 mit
     * shipment[0].warnings (TW0001) und ohne package.
     *
     * @param array $response
     * @param string $number
     * @return array
     */
    public function fromUps(array $response, string $number): array
    {
        $package = $this->emptyPackage($number, self::CARRIER_UPS);
        $upsPackage = $response['trackResponse']['shipment'][0]['package'][0] ?? null;

        if (!is_array($upsPackage) || empty($upsPackage['activity'])) {
            return $package;
        }

        $events = [];
        foreach ($upsPackage['activity'] as $activity) {
            $status = $activity['status'] ?? [];
            $type = strtoupper((string)($status['type'] ?? ''));

            // MV = Versandaufkleber storniert, fuer den Kunden ohne Bedeutung.
            if ($type === 'MV') {
                continue;
            }

            $address = $activity['location']['address'] ?? [];
            $events[] = [
                'date' => $this->compactDate((string)($activity['date'] ?? '')),
                'time' => $this->compactTime((string)($activity['time'] ?? '')),
                'location' => $this->formatLocation((string)($address['city'] ?? ''), (string)($address['countryCode'] ?? '')),
                'text' => $this->cleanText((string)($status['description'] ?? '')),
                'stage' => $this->upsStage($type, $status),
                'problem' => $type === 'X',
                'returned' => $type === 'RS'
            ];
        }

        foreach ($upsPackage['deliveryDate'] ?? [] as $deliveryDate) {
            $date = $this->compactDate((string)($deliveryDate['date'] ?? ''));
            $type = (string)($deliveryDate['type'] ?? '');

            if ($type === 'DEL') {
                $package['deliveredAt'] = ['date' => $date, 'time' => ''];
            } elseif (in_array($type, ['SDD', 'RDD', 'EDD'], true) && strlen($date)) {
                // SDD = geplant, RDD = neu geplant, EDD = geschaetzt
                $package['estimated'] = ['date' => $date, 'from' => '', 'to' => ''];
            }
        }

        $deliveryTime = $upsPackage['deliveryTime'] ?? [];
        if (is_array($package['estimated']) && ($deliveryTime['type'] ?? '') === 'EDW') {
            $package['estimated']['from'] = $this->compactTime((string)($deliveryTime['startTime'] ?? ''));
            $package['estimated']['to'] = $this->compactTime((string)($deliveryTime['endTime'] ?? ''));
        }

        // Ort der Abgabe ("Haustuer", "UPS Access Point" ...). receivedBy enthaelt den
        // Namen des Empfaengers und wird absichtlich nicht uebernommen.
        $package['deliveryLocation'] = $this->cleanText((string)($upsPackage['deliveryInformation']['location'] ?? ''));

        return $this->finish($package, $events);
    }

    /**
     * Antwort der DHL Shipment Tracking API - Unified (GET /track/shipments) umwandeln.
     *
     * Aufbau: shipments[0] mit status, events[] (neueste zuerst), estimatedTimeOfDelivery
     * bzw. estimatedDeliveryTimeFrame. statusCode ist einer von pre-transit, transit,
     * delivered, failure, unknown.
     *
     * @param array $response
     * @param string $number
     * @return array
     */
    public function fromDhl(array $response, string $number): array
    {
        $package = $this->emptyPackage($number, self::CARRIER_DHL);
        $shipment = $response['shipments'][0] ?? null;

        if (!is_array($shipment)) {
            return $package;
        }

        $rawEvents = $shipment['events'] ?? [];
        if (!count($rawEvents) && isset($shipment['status'])) {
            $rawEvents = [$shipment['status']];
        }

        $events = [];
        foreach ($rawEvents as $event) {
            $code = strtolower((string)($event['statusCode'] ?? ''));
            $text = $this->cleanText((string)($event['description'] ?? ($event['status'] ?? '')));
            $dateTime = $this->isoDateTime((string)($event['timestamp'] ?? ''));
            $address = $event['location']['address'] ?? [];

            $events[] = [
                'date' => $dateTime['date'],
                'time' => $dateTime['time'],
                'location' => $this->formatLocation((string)($address['addressLocality'] ?? ''), (string)($address['countryCode'] ?? '')),
                'text' => $text,
                'stage' => $this->dhlStage($code, $text),
                'problem' => $code === 'failure',
                'returned' => (bool)preg_match(self::DHL_RETURNED_PATTERN, $text)
            ];
        }

        $timeFrame = $shipment['estimatedDeliveryTimeFrame'] ?? null;
        if (is_array($timeFrame) && !empty($timeFrame['estimatedFrom'])) {
            $from = $this->isoDateTime((string)$timeFrame['estimatedFrom']);
            $through = $this->isoDateTime((string)($timeFrame['estimatedThrough'] ?? ''));
            $package['estimated'] = ['date' => $from['date'], 'from' => $from['time'], 'to' => $through['time']];
        } elseif (!empty($shipment['estimatedTimeOfDelivery'])) {
            $estimated = $this->isoDateTime((string)$shipment['estimatedTimeOfDelivery']);
            $package['estimated'] = ['date' => $estimated['date'], 'from' => '', 'to' => ''];
        }

        return $this->finish($package, $events);
    }

    /**
     * Paket mit einem Fehler beim Abruf kennzeichnen. Die Seite zeigt dann den Link
     * zum Paketdienst statt eines Verlaufs.
     *
     * @param string $number
     * @param string $carrier
     * @return array
     */
    public function failedPackage(string $number, string $carrier): array
    {
        $package = $this->emptyPackage($number, $carrier);
        $package['error'] = true;

        return $package;
    }

    /**
     * Beschriftungen ergaenzen, die vom heutigen Datum abhaengen. Wird nach dem Cache
     * aufgerufen, damit "heute" nach Mitternacht nicht stehen bleibt.
     *
     * @param array $package
     * @return array
     */
    public function addLabels(array $package): array
    {
        if (is_array($package['estimated'])) {
            $package['estimated']['label'] = $this->dateLabel($package['estimated']['date']);
        }

        if (is_array($package['deliveredAt'])) {
            $package['deliveredAt']['label'] = $this->dateLabel($package['deliveredAt']['date']);
        }

        foreach ($package['events'] as $index => $event) {
            $package['events'][$index]['dateLabel'] = $this->dateLabel($event['date']);
        }

        return $package;
    }

    /**
     * "heute", "morgen", "gestern" oder "Donnerstag, 08.10.".
     *
     * @param string $date Y-m-d
     * @return string
     */
    public function dateLabel(string $date): string
    {
        $timestamp = strtotime($date . ' 12:00:00');
        if (!strlen($date) || $timestamp === false) {
            return '';
        }

        $difference = (int)round(($timestamp - strtotime($this->today . ' 12:00:00')) / 86400);
        if ($difference === 0) {
            return 'heute';
        }
        if ($difference === 1) {
            return 'morgen';
        }
        if ($difference === -1) {
            return 'gestern';
        }

        return self::WEEKDAYS[(int)date('w', $timestamp)] . ', ' . date('d.m.', $timestamp);
    }

    /**
     * Link zur Seite des Paketdienstes fuer alle Details.
     *
     * @param string $carrier
     * @param string $number
     * @return string
     */
    public function carrierUrl(string $carrier, string $number): string
    {
        if ($carrier === self::CARRIER_UPS) {
            return 'https://www.ups.com/track?loc=de_DE&tracknum=' . rawurlencode($number);
        }

        if ($carrier === self::CARRIER_DHL) {
            return 'https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?piececode=' . rawurlencode($number);
        }

        return '';
    }

    /**
     * Ereignisse sortieren und daraus Stufe, Zustand und Hinweistext ableiten.
     *
     * @param array $package
     * @param array $events
     * @return array
     */
    private function finish(array $package, array $events): array
    {
        if (!count($events)) {
            return $package;
        }

        usort($events, function ($a, $b) {
            return strcmp($b['date'] . $b['time'], $a['date'] . $a['time']);
        });

        $stage = self::STAGE_PACKED;
        $returned = false;
        foreach ($events as $index => $event) {
            if ($event['stage'] !== null && $event['stage'] > $stage) {
                $stage = $event['stage'];
            }
            $returned = $returned || $event['returned'];

            // Der Text "Aufkleber erstellt / Daten elektronisch uebermittelt" klingt bei
            // jedem Paketdienst anders. Einheitlich formuliert, weil er bei jeder
            // Sendung vorkommt.
            if ($event['stage'] === self::STAGE_PACKED) {
                $events[$index]['text'] = 'Das Paket ist verpackt. Die Sendungsdaten wurden an ' . $package['carrierName'] . ' übermittelt.';
            }
        }

        $latest = $events[0];
        $package['stage'] = $stage;
        $package['events'] = $events;

        // Ruecksendung zuerst pruefen: Kommt das Paket bei uns an, meldet der
        // Paketdienst ebenfalls "zugestellt".
        if ($returned) {
            $package['state'] = self::STATE_RETURNED;
            $package['message'] = $latest['text'];
            $package['estimated'] = null;
            $package['deliveredAt'] = null;
        } elseif ($stage === self::STAGE_DELIVERED) {
            $package['state'] = self::STATE_OK;
            $delivered = $this->firstEventOfStage($events, self::STAGE_DELIVERED);
            $package['deliveredAt'] = [
                'date' => $delivered['date'] ?: ($package['deliveredAt']['date'] ?? ''),
                'time' => $delivered['time']
            ];
            $package['estimated'] = null;
        } elseif ($latest['problem']) {
            $package['state'] = self::STATE_PROBLEM;
            $package['message'] = $latest['text'];
        } else {
            $package['state'] = self::STATE_OK;
        }

        return $package;
    }

    /**
     * @param array $events neueste zuerst
     * @param int $stage
     * @return array
     */
    private function firstEventOfStage(array $events, int $stage): array
    {
        foreach (array_reverse($events) as $event) {
            if ($event['stage'] === $stage) {
                return $event;
            }
        }

        return ['date' => '', 'time' => ''];
    }

    /**
     * @param string $type activity.status.type
     * @param array $status
     * @return int|null null = Stufe bleibt wie sie ist (z. B. Zustellproblem)
     */
    private function upsStage(string $type, array $status)
    {
        switch ($type) {
            case 'M':
                return self::STAGE_PACKED;
            case 'D':
                return self::STAGE_DELIVERED;
            case 'P':
            case 'I':
            case 'O':
            case 'W':
            case 'DO':
            case 'DD':
                $code = strtoupper((string)($status['code'] ?? ''));
                $statusCode = (string)($status['statusCode'] ?? '');
                if ($type === 'O' || in_array($code, self::UPS_OUT_FOR_DELIVERY_CODES, true) || $statusCode === self::UPS_OUT_FOR_DELIVERY_STATUS) {
                    return self::STAGE_OUT_FOR_DELIVERY;
                }

                return self::STAGE_IN_TRANSIT;
            default:
                return null;
        }
    }

    /**
     * @param string $code
     * @param string $text
     * @return int|null
     */
    private function dhlStage(string $code, string $text)
    {
        switch ($code) {
            case 'pre-transit':
                return self::STAGE_PACKED;
            case 'transit':
                return preg_match(self::DHL_OUT_FOR_DELIVERY_PATTERN, $text)
                    ? self::STAGE_OUT_FOR_DELIVERY
                    : self::STAGE_IN_TRANSIT;
            case 'delivered':
                return self::STAGE_DELIVERED;
            default:
                return null;
        }
    }

    /**
     * UPS liefert Datum als "20261008".
     *
     * @param string $value
     * @return string Y-m-d
     */
    private function compactDate(string $value): string
    {
        if (!preg_match('/^(\d{4})(\d{2})(\d{2})$/', $value, $matches)) {
            return '';
        }

        return $matches[1] . '-' . $matches[2] . '-' . $matches[3];
    }

    /**
     * UPS liefert Uhrzeit als "074253".
     *
     * @param string $value
     * @return string H:i
     */
    private function compactTime(string $value): string
    {
        if (!preg_match('/^(\d{2})(\d{2})(\d{2})?$/', $value, $matches)) {
            return '';
        }

        return $matches[1] . ':' . $matches[2];
    }

    /**
     * DHL liefert ISO-Zeitstempel, teils mit, teils ohne Zeitzone.
     *
     * @param string $value
     * @return array ['date' => 'Y-m-d', 'time' => 'H:i']
     */
    private function isoDateTime(string $value): array
    {
        // Ohne "new \DateTime": "new" ist im Plugin-Code nicht erlaubt.
        $value = trim($value);
        if (!preg_match('/^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2}))?/', $value, $matches)) {
            return ['date' => '', 'time' => ''];
        }

        // UTC ("...Z") in Serverzeit umrechnen. Alle anderen Zeitstempel sind schon
        // Ortszeit des Ereignisses und werden unveraendert uebernommen.
        if (substr($value, -1) === 'Z' && isset($matches[2])) {
            $timestamp = strtotime($value);
            if ($timestamp !== false) {
                return ['date' => date('Y-m-d', $timestamp), 'time' => date('H:i', $timestamp)];
            }
        }

        // Ohne Uhrzeit im Zeitstempel keine "00:00 Uhr" anzeigen.
        return ['date' => $matches[1], 'time' => $matches[2] ?? ''];
    }

    /**
     * "MAGDEBURG" -> "Magdeburg", Ausland mit Laenderkuerzel.
     *
     * @param string $city
     * @param string $countryCode
     * @return string
     */
    private function formatLocation(string $city, string $countryCode): string
    {
        $city = trim($city);
        if ($this->isAllUpperCase($city)) {
            $words = explode(' ', mb_strtolower($city, 'UTF-8'));
            foreach ($words as $wordIndex => $word) {
                // Doppelnamen wie "Halle-Neustadt"
                $parts = explode('-', $word);
                foreach ($parts as $partIndex => $part) {
                    $parts[$partIndex] = $this->upperFirst($part);
                }
                $words[$wordIndex] = implode('-', $parts);
            }
            $city = implode(' ', $words);
        }

        $countryCode = strtoupper(trim($countryCode));
        if ($city !== '' && $countryCode !== '' && $countryCode !== 'DE') {
            $city .= ', ' . $countryCode;
        }

        return $city;
    }

    /**
     * Leerzeichen bereinigen und durchgehende Grossschreibung ("ZUGESTELLT") entschaerfen.
     *
     * @param string $text
     * @return string
     */
    private function cleanText(string $text): string
    {
        $text = trim(preg_replace('/\s+/u', ' ', $text));

        if ($this->isAllUpperCase($text)) {
            $text = $this->upperFirst(mb_strtolower($text, 'UTF-8'));
        }

        return $text;
    }

    /**
     * Enthaelt Grossbuchstaben, aber keinen einzigen Kleinbuchstaben.
     * (mb_strtoupper ist im Plugin-Code nicht erlaubt.)
     *
     * @param string $text
     * @return bool
     */
    private function isAllUpperCase(string $text): bool
    {
        return (bool)preg_match('/\p{Lu}/u', $text) && !preg_match('/\p{Ll}/u', $text);
    }

    /**
     * Ersten Buchstaben gross schreiben, auch bei Umlauten. strtoupper kennt nur ASCII,
     * mb_strtoupper ist im Plugin-Code nicht erlaubt.
     *
     * @param string $text
     * @return string
     */
    private function upperFirst(string $text): string
    {
        $first = strtr(mb_substr($text, 0, 1, 'UTF-8'), self::UPPER_UMLAUTS);

        return strtoupper($first) . mb_substr($text, 1, null, 'UTF-8');
    }
}
