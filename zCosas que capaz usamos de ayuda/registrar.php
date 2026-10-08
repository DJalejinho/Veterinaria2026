<?php
include 'conecction.php';

if (isset($_POST['registrar'])){
    if (strlen($_POST['email']) >= 1 && strlen($_POST['contraseña']) >= 1) {
    $email = trim($_POST['email']);
    $contraseña = trim($_POST['contraseña']);
    $consulta = "INSERT INTO `usuario`(email, contraseña) VALUES ('$email','$contraseña')";
        $resultado = mysqli_query($con, $consulta);

    if ($resultado) {
        ?>
        <h3 class="ok">¡Te has registrado correctamente! copado.</h3>
        <?php
    } else {
        ?>
        <h3 class="bad">¡Upa, te la re mandaste! macanudo.</h3>
        <?php
    }
} 
}


?>