<?php
include '/BaseDeDatos/connection.php';

if (isset($_POST['login'])) {
    if (!empty($_POST['email']) && !empty($_POST['contraseña'])) {
        
        $email = trim($_POST['email']);
        $contraseña = trim($_POST['contraseña']);

        // 2. Enviamos la consulta a MySQL
        $consulta = "SELECT * FROM usuario WHERE email = '$email' AND contraseña = '$contraseña'";
        $resultado = mysqli_query($con, $consulta);

        // -------------------------------------------------------------------
        // 3. ¡ACÁ VA LA CONFIRMACIÓN!
        // Verificamos que la consulta no falló Y que encontró al menos 1 fila
        // -------------------------------------------------------------------
        if ($resultado && mysqli_num_rows($resultado) > 0) {
            
            // Si entra acá, significa que EL USUARIO Y LA CONTRASEÑA EXISTEN EN LA BD
            echo '<h3 class="ok">¡Te has logueado correctamente! copado.</h3>';
            
        } else {
            // Si devuelve 0 filas, entra acá
            echo '<h3 class="bad">Email o contraseña incorrectos, macanudo.</h3>';
        }

    } else {
        echo '<h3 class="bad">Por favor completa todos los campos, botija.</h3>';
    }
}
?>  