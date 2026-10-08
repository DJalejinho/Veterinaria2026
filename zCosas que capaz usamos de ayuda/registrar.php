<?php
declare(strict_types=1);

session_start();
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim((string) ($_POST['email'] ?? ''));
    $password = (string) ($_POST['password'] ?? $_POST['contraseña'] ?? '');
    $token = (string) ($_POST['csrf_token'] ?? '');

    if (!hash_equals($_SESSION['csrf_token'], $token)) {
        $error = 'La sesión del formulario venció. Recarga la página e inténtalo de nuevo.';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $error = 'Ingresa un correo electrónico válido.';
    } elseif (strlen($password) < 8) {
        $error = 'La contraseña debe tener al menos 8 caracteres.';
    } else {
        try {
            require dirname(__DIR__) . '/BaseDeDatos/connection.php';
            $check = $con->prepare('SELECT 1 FROM `usuario` WHERE `email` = ? LIMIT 1');
            $check->bind_param('s', $email);
            $check->execute();
            $check->store_result();
            $alreadyExists = $check->num_rows > 0;
            $check->close();

            if ($alreadyExists) {
                $error = 'Ya existe una cuenta con ese correo.';
            } else {
                $passwordHash = password_hash($password, PASSWORD_DEFAULT);
                $insert = $con->prepare('INSERT INTO `usuario` (`email`, `contraseña`) VALUES (?, ?)');
                $insert->bind_param('ss', $email, $passwordHash);
                $insert->execute();
                $insert->close();
                header('Location: login.php?registrado=1');
                exit;
            }
        } catch (Throwable $exception) {
            error_log('Error al crear cuenta: ' . $exception->getMessage());
            $error = 'No se pudo crear la cuenta. Verifica la base de datos y que el correo no esté repetido.';
        }
    }
}
?>
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Crear cuenta</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/source-sans-3@5.0.12/index.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css">
  <link rel="stylesheet" href="../VistaAdmin/dist/css/adminlte.css">
</head>
<body class="register-page bg-body-secondary">
  <div class="register-box">
    <div class="card card-outline card-primary">
      <div class="card-header text-center"><a href="../VistaAdmin/index.html" class="h1 text-decoration-none"><b>Crear cuenta</b></a></div>
      <div class="card-body">
        <p class="register-box-msg">Registra tu correo para continuar</p>
        <?php if ($error !== ''): ?>
          <div class="alert alert-danger" role="alert"><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></div>
        <?php endif; ?>
        <form action="registrar.php" method="post">
          <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($_SESSION['csrf_token'], ENT_QUOTES, 'UTF-8') ?>">
          <div class="input-group mb-3">
            <input class="form-control" type="email" name="email" placeholder="Correo electrónico" autocomplete="email" required>
            <div class="input-group-text"><span class="bi bi-envelope"></span></div>
          </div>
          <div class="input-group mb-3">
            <input class="form-control" type="password" name="password" placeholder="Contraseña (mínimo 8 caracteres)" autocomplete="new-password" minlength="8" required>
            <div class="input-group-text"><span class="bi bi-lock"></span></div>
          </div>
          <div class="row">
            <div class="col-8 d-flex align-items-center"><a href="login.php">Ya tengo cuenta</a></div>
            <div class="col-4"><button type="submit" class="btn btn-primary w-100">Crear</button></div>
          </div>
        </form>
      </div>
    </div>
  </div>
</body>
</html>
