<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'phpmailer/PHPMailer.php';
require 'phpmailer/SMTP.php';
require 'phpmailer/Exception.php';

require 'config.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {

    $nombre    = htmlspecialchars(trim($_POST['nombre']));
    $apellido  = htmlspecialchars(trim($_POST['apellido']));
    $email     = htmlspecialchars(trim($_POST['email']));
    $telefono  = htmlspecialchars(trim($_POST['telefono']));
    $asunto    = htmlspecialchars(trim($_POST['asunto']));
    $mensaje   = nl2br(htmlspecialchars(trim($_POST['mensaje'])));

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        die("Correo electrónico inválido.");
    }

    $mail = new PHPMailer(true);

    try {

        $mail->isSMTP();
        $mail->Host = SMTP_HOST;
        $mail->SMTPAuth = true;
        $mail->Username = SMTP_USER;
        $mail->Password = SMTP_PASS;
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = SMTP_PORT;

        $mail->CharSet = "UTF-8";

        $mail->setFrom(SMTP_FROM, SMTP_FROM_NAME);

        $mail->addAddress("eusolucionesdigitales@gmail.com");

        $mail->addReplyTo($email, $nombre . " " . $apellido);

        $mail->isHTML(true);

        $mail->Subject = "Nueva consulta - " . $asunto;

        $mail->Body = "
        <h2>Nueva consulta desde la Web de EU! Soluciones Digitales</h2>

        <hr>

        <p><strong>Nombre:</strong> {$nombre} {$apellido}</p>

        <p><strong>Email:</strong> {$email}</p>

        <p><strong>Teléfono:</strong> {$telefono}</p>

        <p><strong>Asunto:</strong> {$asunto}</p>

        <p><strong>Mensaje:</strong></p>

        <p>{$mensaje}</p>
        ";

        $mail->AltBody = "
Nombre: $nombre $apellido

Email: $email

Teléfono: $telefono

Asunto: $asunto

Mensaje:

" . strip_tags($mensaje);

        $mail->send();

        header("Location: index.html?enviado=1#contacto");
        exit();

    } catch (Exception $e) {

        echo "Error al enviar el correo.<br>";
        echo $mail->ErrorInfo;

    }

}