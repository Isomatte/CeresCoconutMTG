<?php

namespace CeresCoconutMTG\Controllers;

use Plenty\Plugin\ConfigRepository;
use Plenty\Plugin\Controller;
use Plenty\Plugin\Http\Request;
use Plenty\Plugin\Http\Response;
use Plenty\Plugin\Log\Loggable;
use Plenty\Plugin\Mail\Contracts\MailerContract;
use Plenty\Plugin\Mail\Models\ReplyTo;
use Plenty\Plugin\Templates\Twig;

/**
 * Class CancellationFormController
 *
 * Nimmt die Widerrufserklaerung des Theme-Formulars entgegen und verschickt die
 * Mails selbst, damit der Reply-To-Header auf die Kontakt-E-Mail des Kunden zeigt.
 *
 * @package CeresCoconutMTG\Controllers
 */
class CancellationFormController extends Controller
{
    use Loggable;

    /** Minimale Zeit zwischen Seitenaufbau und Absenden in Millisekunden (Bot-Schutz). */
    const MIN_FILL_TIME = 2500;

    /** Maximale Laenge, die je Feld in die Mail uebernommen wird. */
    const MAX_FIELD_LENGTH = 2000;

    /**
     * Felder des Formulars: Schluessel => Uebersetzungsschluessel der Beschriftung.
     * Die Reihenfolge bestimmt die Reihenfolge in der Mail.
     */
    const FIELDS = [
        'name'       => 'cancellationFieldName',
        'address'    => 'cancellationFieldAddress',
        'order'      => 'cancellationFieldOrder',
        'email'      => 'cancellationFieldEmail',
        'orderedAt'  => 'cancellationFieldOrderedAt',
        'receivedAt' => 'cancellationFieldReceivedAt',
        'reason'     => 'cancellationFieldReason'
    ];

    /** Felder, ohne die keine Widerrufserklaerung zugeordnet werden kann. */
    const REQUIRED_FIELDS = ['name', 'order', 'email'];

    /** @var Request */
    private $request;

    /** @var Response */
    private $response;

    /** @var ConfigRepository */
    private $config;

    public function __construct(Request $request, Response $response, ConfigRepository $config)
    {
        $this->request = $request;
        $this->response = $response;
        $this->config = $config;
    }

    /**
     * Widerrufserklaerung entgegennehmen und versenden.
     *
     * @return Response
     */
    public function send(): Response
    {
        // Honeypot: von echten Nutzern nie ausgefuellt. Bots bekommen ein OK, damit sie
        // nicht anfangen, Varianten durchzuprobieren.
        if (strlen(trim((string)$this->request->get('username', '')))) {
            return $this->json(['success' => true]);
        }

        if ((int)$this->request->get('elapsed', 0) < self::MIN_FILL_TIME) {
            return $this->json(['success' => false, 'error' => 'tooFast'], 422);
        }

        $data = [];
        foreach (array_keys(self::FIELDS) as $key) {
            $data[$key] = $this->readField($key);
        }

        $invalidFields = [];
        foreach (self::REQUIRED_FIELDS as $required) {
            if (!strlen($data[$required])) {
                $invalidFields[] = $required;
            }
        }

        if (strlen($data['email']) && !$this->isMailAddress($data['email'])) {
            $invalidFields[] = 'email';
        }

        if (count($invalidFields)) {
            return $this->json([
                'success' => false,
                'error' => 'validation',
                'fields' => array_values(array_unique($invalidFields))
            ], 422);
        }

        // Der Empfaenger kommt bewusst aus der Plugin-Konfiguration und nicht aus dem
        // Request. Sonst waere der Endpunkt ein offenes Mail-Relay.
        $recipient = trim((string)$this->config->get('CeresCoconutMTG.cancellation.recipient'));

        if (!$this->isMailAddress($recipient)) {
            $this->getLogger(__METHOD__)->error(
                'CeresCoconutMTG: Kein gueltiger Empfaenger fuer das Widerrufsformular konfiguriert.',
                ['recipient' => $recipient]
            );

            return $this->json(['success' => false, 'error' => 'noRecipient'], 500);
        }

        $receivedAt = date('d.m.Y H:i:s');
        $mailData = [
            'fields' => $this->buildFieldList($data),
            'values' => $data,
            'receivedAt' => $receivedAt,
            'receivedAtIso' => date('c'),
            'shopMail' => $recipient
        ];

        /** @var Twig $twig */
        $twig = pluginApp(Twig::class);
        /** @var MailerContract $mailer */
        $mailer = pluginApp(MailerContract::class);

        $subject = trim((string)$this->config->get('CeresCoconutMTG.cancellation.subject'));
        if (!strlen($subject)) {
            $subject = 'Widerruf';
        }
        $subject .= ' | ' . $data['order'] . ' | ' . $data['name'];

        // Das eigentliche Ziel dieser Klasse: Reply-To zeigt auf die Kundenadresse.
        /** @var ReplyTo $replyTo */
        $replyTo = pluginApp(ReplyTo::class);
        $replyTo->mailAddress = $data['email'];
        $replyTo->name = $data['name'];

        try {
            $mailer->sendHtml(
                $twig->render('CeresCoconutMTG::Mail.CancellationMail', $mailData),
                $recipient,
                $subject,
                [],
                [],
                $replyTo
            );
        } catch (\Exception $exception) {
            $this->getLogger(__METHOD__)->error(
                'CeresCoconutMTG: Widerrufsmail an den Shop konnte nicht versendet werden.',
                ['message' => $exception->getMessage()]
            );

            return $this->json(['success' => false, 'error' => 'sendFailed'], 500);
        }

        // Eingangsbestaetigung an den Kunden (Paragraph 356 Abs. 1 Satz 2 BGB).
        // Schlaegt sie fehl, ist der Widerruf trotzdem eingegangen - daher nur loggen.
        if ($this->isEnabled('CeresCoconutMTG.cancellation.customerCopy')) {
            /** @var ReplyTo $shopReplyTo */
            $shopReplyTo = pluginApp(ReplyTo::class);
            $shopReplyTo->mailAddress = $recipient;
            $shopReplyTo->name = '';

            try {
                $mailer->sendHtml(
                    $twig->render('CeresCoconutMTG::Mail.CancellationConfirmationMail', $mailData),
                    $data['email'],
                    'Eingangsbestaetigung Ihres Widerrufs | ' . $data['order'],
                    [],
                    [],
                    $shopReplyTo
                );
            } catch (\Exception $exception) {
                $this->getLogger(__METHOD__)->error(
                    'CeresCoconutMTG: Eingangsbestaetigung an den Kunden konnte nicht versendet werden.',
                    ['message' => $exception->getMessage()]
                );
            }
        }

        return $this->json(['success' => true, 'receivedAt' => $receivedAt]);
    }

    /**
     * Einen Wert aus dem Request lesen, trimmen und auf Maximallaenge kuerzen.
     *
     * @param string $key
     * @return string
     */
    private function readField(string $key): string
    {
        $value = $this->request->get($key, '');

        if (!is_string($value)) {
            return '';
        }

        // mb_substr, damit ein Umlaut am Schnittpunkt nicht halbiert wird.
        return mb_substr(trim($value), 0, self::MAX_FIELD_LENGTH, 'UTF-8');
    }

    /**
     * Ausgefuellte Felder mit Beschriftung fuer die Mail-Templates aufbereiten.
     *
     * @param array $data
     * @return array
     */
    private function buildFieldList(array $data): array
    {
        $fields = [];

        foreach (self::FIELDS as $key => $translationKey) {
            if (strlen($data[$key])) {
                $fields[] = [
                    'key' => $key,
                    'label' => 'CeresCoconutMTG::Template.' . $translationKey,
                    'value' => $data[$key]
                ];
            }
        }

        return $fields;
    }

    /**
     * @param string $value
     * @return bool
     */
    private function isMailAddress(string $value): bool
    {
        return (bool)preg_match('/^[^@\s]+@[^@\s.]+(\.[^@\s.]+)+$/', $value);
    }

    /**
     * Die Plugin-Konfiguration liefert je nach Feldtyp bool oder String zurueck.
     *
     * @param string $key
     * @return bool
     */
    private function isEnabled(string $key): bool
    {
        $value = $this->config->get($key);

        return $value === true || $value === 'true' || $value === 1 || $value === '1';
    }

    /**
     * @param array $data
     * @param int $code
     * @return Response
     */
    private function json(array $data, int $code = 200): Response
    {
        return $this->response->make(
            json_encode($data),
            $code,
            ['Content-Type' => 'application/json; charset=utf-8']
        );
    }
}
