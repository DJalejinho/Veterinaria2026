<?php
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

$con = mysqli_connect('localhost', 'root', '', 'bd_equipo5');
mysqli_set_charset($con, 'utf8mb4');
