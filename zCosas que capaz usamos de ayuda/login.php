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
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '') {
        $error = 'Ingresa un correo y una contraseña válidos.';
    } else {
        try {
            require dirname(__DIR__) . '/BaseDeDatos/connection.php';
            $stmt = $con->prepare('SELECT `contraseña` FROM `usuario` WHERE `email` = ? LIMIT 1');
            $stmt->bind_param('s', $email);
            $stmt->execute();
            $stmt->store_result();

            $storedPassword = '';
            if ($stmt->num_rows === 1) {
                $stmt->bind_result($storedPassword);
                $stmt->fetch();
            }
            $stmt->close();

            $valid = $storedPassword !== '' && password_verify($password, $storedPassword);
            // Migra contraseñas guardadas en texto plano por el borrador anterior.
            if (!$valid && $storedPassword !== '' && hash_equals($storedPassword, $password)) {
                $newHash = password_hash($password, PASSWORD_DEFAULT);
                $update = $con->prepare('UPDATE `usuario` SET `contraseña` = ? WHERE `email` = ?');
                $update->bind_param('ss', $newHash, $email);
                $update->execute();
                $update->close();
                $valid = true;
            }

            if ($valid) {
                session_regenerate_id(true);
                $_SESSION['usuario_email'] = $email;
                $_SESSION['autenticado'] = true;
                header('Location: ../VistaAdmin/index.html');
                exit;
            }

            $error = 'El correo o la contraseña no son correctos.';
        } catch (Throwable $exception) {
            error_log('Error al iniciar sesión: ' . $exception->getMessage());
            $error = 'No se pudo conectar con la base de datos. Verifica que MySQL esté iniciado.';
        }
    }
}
?>
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Iniciar sesión</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/source-sans-3@5.0.12/index.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css">
  <link rel="stylesheet" href="../VistaAdmin/dist/css/adminlte.css">
</head>
<body class="login-page bg-body-secondary">
  <div class="login-box">
    <div class="card card-outline card-primary">
      <div class="card-header text-center"><a href="../VistaAdmin/index.html" class="h1 text-decoration-none"><b>Mi panel</b></a></div>
      <div class="card-body">
        <p class="login-box-msg">Inicia sesión para continuar</p>
        <?php if ($error !== ''): ?>
          <div class="alert alert-danger" role="alert"><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></div>
        <?php elseif (isset($_GET['registrado'])): ?>
          <div class="alert alert-success" role="status">Tu cuenta se creó. Ya puedes iniciar sesión.</div>
        <?php endif; ?>
        <form action="login.php" method="post">
          <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($_SESSION['csrf_token'], ENT_QUOTES, 'UTF-8') ?>">
          <div class="input-group mb-3">
            <input class="form-control" type="email" name="email" placeholder="Correo electrónico" autocomplete="email" required>
            <div class="input-group-text"><span class="bi bi-envelope"></span></div>
          </div>
          <div class="input-group mb-3">
            <input class="form-control" type="password" name="password" placeholder="Contraseña" autocomplete="current-password" required>
            <div class="input-group-text"><span class="bi bi-lock"></span></div>
          </div>
          <div class="row">
            <div class="col-8 d-flex align-items-center"><a href="registrar.php">Crear una cuenta</a></div>
            <div class="col-4"><button type="submit" class="btn btn-primary w-100">Entrar</button></div>
          </div>
        </form>
      </div>
    </div>
  </div>
</body>
</html>
