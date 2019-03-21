<?php
    if((isset($_POST['name'])&&$_POST['name']!="")&&(isset($_POST['email'])&&$_POST['email']!="")){
        $to = 'avs@lanars.com'; //Почта получателя, через запятую можно указать сколько угодно адресов
        $subject = 'Сообщение от пользователя сайта Batt'; //Заголовок сообщения
        $message = '
                <html>
                    <head>
                        <title>'.$subject.'</title>
                    </head>
                    <body>
                        <p>Имя: '.$_POST['name'].'</p>
                        <p>E-mail: '.$_POST['email'].'</p>  
                        <p>Сообщение пользователя: '.$_POST['message'].'</p> 
                    </body>
                </html>'; //Текст нашего сообщения можно использовать HTML теги
        $headers  = "Content-type: text/html; charset=utf-8 \r\n"; //Кодировка письма
        $headers .= "От: Пользователь ".$_POST['name'].". Email:  ".$_POST['email']."\r\n"; //Наименование и почта отправителя
        $send = mail($to, $subject, $message, $headers); //Отправка письма с помощью функции mail 
        echo json_encode(array('send' => $send ));
    }
?>