<?php
/**
 * ShineCars — booking endpoint (developer stub)
 * =============================================
 * File: api/book.php  (upload the whole `api/` folder with the site)
 *
 * What it does
 * ------------
 * Accepts a booking POST from the website form (assets/js/main.js) as
 * either JSON (`Content-Type: application/json`) or a normal form POST
 * (`application/x-www-form-urlencoded` / `multipart/form-data`), validates
 * and sanitises the same fields the form collects, and answers JSON:
 *
 *   Success:  HTTP 200  {"ok":true, "message":"Booking received. ..."}
 *   Bad data: HTTP 400  {"ok":false,"message":"...","errors":{"field":"..."}}
 *   Wrong method: HTTP 405 {"ok":false,"message":"Method not allowed"}
 *
 * Expected payload (same shape main.js sends):
 *   {
 *     "customer_name":  "Rohan Sharma",          // required, 2-100 chars
 *     "car_model":      "Hyundai Creta",         // required, 2-100 chars
 *     "service":        "ceramic-coating",       // required, see allow-list
 *     "preferred_date": "2026-11-15",            // required, YYYY-MM-DD, not past
 *     "location":       "studio",                // required: "studio"|"doorstep"
 *     "source":         "website-booking",       // optional, informational
 *     "submitted_at":   "2026-11-10T10:30:00Z"   // optional, informational
 *   }
 * Service machine values: ppf, ceramic-coating, graphene-coating,
 * foam-wash, interior-detailing, paint-correction, complete-makeover,
 * home-office-cleaning.
 *
 * How to switch it on (see README > "Booking backend (optional)")
 * ----------------------------------------------------------------
 * 1. Upload this file to your host (Hostinger / HostGator: put the
 *    `api/` folder inside public_html next to index.html).
 * 2. In index.html, set the form's data-backend-url="/api/book.php".
 * 3. Done. Until then data-backend-url is empty and the form keeps
 *    using the WhatsApp-only flow; if this endpoint ever fails, the
 *    form also falls back to WhatsApp, so no booking is lost.
 *
 * Security notes
 * --------------
 * - Same-origin only by default: no CORS headers are sent, so only
 *   pages on your own domain can call this endpoint from a browser.
 * - No credentials are stored here. The database / email placeholders
 *   below are commented out — fill in YOUR OWN details in a config
 *   file OUTSIDE public_html and never commit passwords to git.
 * - Inputs are trimmed, stripped of HTML tags and length-limited;
 *   the database example uses a prepared statement (no string-built SQL).
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

function json_response(int $status, array $body): void
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

/* Only POST is allowed. */
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    json_response(405, ['ok' => false, 'message' => 'Method not allowed. Use POST.']);
}

/* Read the body: JSON first, plain form POST as fallback. */
$data = [];
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
if (stripos($contentType, 'application/json') !== false) {
    $decoded = json_decode(file_get_contents('php://input'), true);
    if (!is_array($decoded)) {
        json_response(400, ['ok' => false, 'message' => 'Invalid JSON body.']);
    }
    $data = $decoded;
}
if (!$data) {
    $data = $_POST; // form-encoded / multipart fallback
}

/* --- Sanitise ------------------------------------------------------- */
function clean_text($value, int $maxLength): string
{
    $value = trim((string) ($value ?? ''));
    $value = strip_tags($value);
    $value = preg_replace('/\s+/', ' ', $value) ?? '';
    if (function_exists('mb_substr')) {
        return mb_substr($value, 0, $maxLength);
    }
    return substr($value, 0, $maxLength);
}

$allowedServices = [
    'ppf', 'ceramic-coating', 'graphene-coating', 'foam-wash',
    'interior-detailing', 'paint-correction', 'complete-makeover',
    'home-office-cleaning',
];
$allowedLocations = ['studio', 'doorstep'];

$customerName  = clean_text($data['customer_name'] ?? '', 100);
$carModel      = clean_text($data['car_model'] ?? '', 100);
$service       = clean_text($data['service'] ?? '', 50);
$preferredDate = clean_text($data['preferred_date'] ?? '', 10);
$location      = clean_text($data['location'] ?? '', 20);
$source        = clean_text($data['source'] ?? 'website-booking', 50);
$submittedAt   = clean_text($data['submitted_at'] ?? '', 40);

/* --- Validate (same rules as the form) ------------------------------ */
$errors = [];

if ($customerName === '' || mb_strlen($customerName) < 2) {
    $errors['customer_name'] = 'Please enter your name.';
}
if ($carModel === '' || mb_strlen($carModel) < 2) {
    $errors['car_model'] = 'Please enter your car model.';
}
if (!in_array($service, $allowedServices, true)) {
    $errors['service'] = 'Please choose a valid service.';
}
$date = DateTimeImmutable::createFromFormat('!Y-m-d', $preferredDate);
if ($date === false || $date->format('Y-m-d') !== $preferredDate) {
    $errors['preferred_date'] = 'Please choose a valid date (YYYY-MM-DD).';
} elseif ($preferredDate < date('Y-m-d')) {
    $errors['preferred_date'] = 'Preferred date cannot be in the past.';
}
if (!in_array($location, $allowedLocations, true)) {
    $errors['location'] = 'Please choose studio or doorstep.';
}

if ($errors) {
    json_response(400, [
        'ok' => false,
        'message' => 'Please check the highlighted fields.',
        'errors' => $errors,
    ]);
}

$booking = [
    'customer_name'  => $customerName,
    'car_model'      => $carModel,
    'service'        => $service,
    'preferred_date' => $preferredDate,
    'location'       => $location,
    'source'         => $source,
    'submitted_at'   => $submittedAt !== '' ? $submittedAt : date('c'),
];

/* --- PLACEHOLDER: save to a database ----------------------------------
 * Fill in YOUR OWN credentials (keep them in a config file outside
 * public_html, never in this file and never in git). Example with PDO:
 *
 *   $pdo = new PDO(
 *       'mysql:host=localhost;dbname=YOUR_DATABASE;charset=utf8mb4',
 *       'YOUR_DB_USER',
 *       'YOUR_DB_PASSWORD',
 *       [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
 *   );
 *   $stmt = $pdo->prepare(
 *       'INSERT INTO bookings
 *          (customer_name, car_model, service, preferred_date, location, source, submitted_at)
 *        VALUES (:customer_name, :car_model, :service, :preferred_date, :location, :source, :submitted_at)'
 *   );
 *   $stmt->execute($booking);
 *
 * (Table suggestion: bookings(id INT AUTO_INCREMENT PRIMARY KEY,
 *  customer_name VARCHAR(100), car_model VARCHAR(100),
 *  service VARCHAR(50), preferred_date DATE, location VARCHAR(20),
 *  source VARCHAR(50), submitted_at DATETIME, created_at TIMESTAMP
 *  DEFAULT CURRENT_TIMESTAMP).)
 * ---------------------------------------------------------------------- */

/* --- PLACEHOLDER: send an email notification ---------------------------
 * Example (replace the address with the business inbox):
 *
 *   $subject = 'New ShineCars booking: ' . $booking['service']
 *             . ' — ' . $booking['preferred_date'];
 *   $body = "Name: {$booking['customer_name']}\n"
 *         . "Car: {$booking['car_model']}\n"
 *         . "Service: {$booking['service']}\n"
 *         . "Date: {$booking['preferred_date']}\n"
 *         . "Location: {$booking['location']}\n";
 *   mail('bookings@shinecars.in', $subject, $body,
 *        "From: website@shinecars.in\r\nContent-Type: text/plain; charset=utf-8");
 * ---------------------------------------------------------------------- */

json_response(200, [
    'ok' => true,
    'message' => 'Booking received. We will confirm your slot on WhatsApp shortly.',
]);
