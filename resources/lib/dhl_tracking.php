<?php

/**
 * Sendungsstatus bei der DHL Shipment Tracking API - Unified abfragen.
 *
 * Aufruf ueber LibraryCallContract aus ShipmentTrackingService. Plugin-Code in src/
 * darf keine externen HTTP-Aufrufe machen, deshalb liegt der Abruf hier.
 *
 * Parameter: apiKey, trackingNumber, postalCode (PLZ der Lieferadresse; damit liefert
 * DHL ausfuehrlichere Ereignisse).
 * Rueckgabe: ok, response (dekodierte API-Antwort), error.
 */

$apiKey = (string)SdkRestApi::getParam('apiKey');
$trackingNumber = strtoupper(trim((string)SdkRestApi::getParam('trackingNumber')));
$postalCode = trim((string)SdkRestApi::getParam('postalCode'));

$result = ['ok' => false, 'response' => [], 'error' => ''];

if (!preg_match('/^[0-9A-Z]{8,35}$/', $trackingNumber)) {
    $result['error'] = 'invalidNumber';
    return $result;
}

if (!strlen($apiKey)) {
    $result['error'] = 'notConfigured';
    return $result;
}

$query = [
    'trackingNumber' => $trackingNumber,
    'service' => 'parcel-de',
    'language' => 'de'
];

if (preg_match('/^[0-9A-Z]{3,10}$/i', $postalCode)) {
    $query['recipientPostalCode'] = $postalCode;
}

$curl = curl_init('https://api-eu.dhl.com/track/shipments?' . http_build_query($query));
curl_setopt_array($curl, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 5,
    CURLOPT_TIMEOUT => 10,
    CURLOPT_HTTPHEADER => [
        'DHL-API-Key: ' . $apiKey,
        'Accept: application/json'
    ]
]);

$content = curl_exec($curl);
$code = (int)curl_getinfo($curl, CURLINFO_HTTP_CODE);
$error = curl_error($curl);
curl_close($curl);

$data = json_decode(is_string($content) ? $content : '', true);

if ($code === 200 && is_array($data)) {
    $result['ok'] = true;
    $result['response'] = $data;
} elseif ($code === 404) {
    // Nummer (noch) unbekannt: kein Fehler, nur noch keine Daten.
    $result['ok'] = true;
} else {
    // 401 = Schluessel falsch, 429 = Tageslimit erreicht
    $result['error'] = 'HTTP ' . $code . ' ' . $error . ' ' . substr(is_string($content) ? $content : '', 0, 300);
}

return $result;
