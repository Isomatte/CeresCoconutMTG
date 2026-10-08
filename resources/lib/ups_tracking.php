<?php

/**
 * Sendungsstatus bei der UPS Tracking API abfragen.
 *
 * Aufruf ueber LibraryCallContract aus ShipmentTrackingService. Plugin-Code in src/
 * darf keine externen HTTP-Aufrufe machen, deshalb liegt der Abruf hier.
 *
 * Parameter: clientId, clientSecret, token (zwischengespeichertes OAuth-Token, darf
 * leer sein), trackingNumber.
 * Rueckgabe: ok, response (dekodierte API-Antwort), newToken + tokenExpiresIn (wenn
 * ein neues Token geholt wurde), error.
 */

$clientId = (string)SdkRestApi::getParam('clientId');
$clientSecret = (string)SdkRestApi::getParam('clientSecret');
$token = (string)SdkRestApi::getParam('token');
$trackingNumber = strtoupper(trim((string)SdkRestApi::getParam('trackingNumber')));

$baseUrl = 'https://onlinetools.ups.com';

$request = function ($method, $url, array $headers, $body = null) {
    $curl = curl_init($url);
    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_HTTPHEADER => $headers
    ]);

    if ($body !== null) {
        curl_setopt($curl, CURLOPT_POSTFIELDS, $body);
    }

    $content = curl_exec($curl);
    $code = (int)curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $error = curl_error($curl);
    curl_close($curl);

    return ['code' => $code, 'body' => is_string($content) ? $content : '', 'error' => $error];
};

$fetchToken = function () use ($request, $baseUrl, $clientId, $clientSecret) {
    $response = $request(
        'POST',
        $baseUrl . '/security/v1/oauth/token',
        [
            'Authorization: Basic ' . base64_encode($clientId . ':' . $clientSecret),
            'Content-Type: application/x-www-form-urlencoded',
            'Accept: application/json'
        ],
        'grant_type=client_credentials'
    );

    $data = json_decode($response['body'], true);
    if ($response['code'] !== 200 || empty($data['access_token'])) {
        return ['token' => '', 'expiresIn' => 0, 'error' => 'token: HTTP ' . $response['code'] . ' ' . $response['error']];
    }

    return ['token' => (string)$data['access_token'], 'expiresIn' => (int)($data['expires_in'] ?? 0), 'error' => ''];
};

$track = function ($token) use ($request, $baseUrl, $trackingNumber) {
    return $request(
        'GET',
        $baseUrl . '/api/track/v1/details/' . rawurlencode($trackingNumber)
            . '?locale=de_DE&returnSignature=false&returnMilestones=false&returnPOD=false',
        [
            'Authorization: Bearer ' . $token,
            // transId: max. 32 Zeichen, eindeutig je Anfrage
            'transId: mtg' . bin2hex(random_bytes(12)),
            'transactionSrc: meintuergriff',
            'Accept: application/json'
        ]
    );
};

$result = ['ok' => false, 'response' => [], 'newToken' => '', 'tokenExpiresIn' => 0, 'error' => ''];

if (!preg_match('/^[0-9A-Z]{8,35}$/', $trackingNumber)) {
    $result['error'] = 'invalidNumber';
    return $result;
}

if (!strlen($clientId) || !strlen($clientSecret)) {
    $result['error'] = 'notConfigured';
    return $result;
}

if (!strlen($token)) {
    $newToken = $fetchToken();
    if (!strlen($newToken['token'])) {
        $result['error'] = $newToken['error'];
        return $result;
    }

    $token = $newToken['token'];
    $result['newToken'] = $token;
    $result['tokenExpiresIn'] = $newToken['expiresIn'];
}

$response = $track($token);

// Zwischengespeichertes Token abgelaufen oder widerrufen: einmal neu holen.
if ($response['code'] === 401 && !strlen($result['newToken'])) {
    $newToken = $fetchToken();
    if (!strlen($newToken['token'])) {
        $result['error'] = $newToken['error'];
        return $result;
    }

    $result['newToken'] = $newToken['token'];
    $result['tokenExpiresIn'] = $newToken['expiresIn'];
    $response = $track($newToken['token']);
}

$data = json_decode($response['body'], true);

if ($response['code'] === 200 && is_array($data)) {
    $result['ok'] = true;
    $result['response'] = $data;
} elseif ($response['code'] === 404) {
    // Nummer (noch) unbekannt: kein Fehler, nur noch keine Daten.
    $result['ok'] = true;
} else {
    $result['error'] = 'track: HTTP ' . $response['code'] . ' ' . $response['error'] . ' ' . substr($response['body'], 0, 300);
}

return $result;
