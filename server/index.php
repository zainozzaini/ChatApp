<?php
  $params = json_decode(file_get_contents('php://input'),true);

  //token -> username
  $users = [
  	"abc123"=>"hamid",
  	"123abc"=>"hamidah"
  ];
  $tokens = array_keys($users);

  $statusCode = 404;
  /*
	do anything here about credentials, updating database etc.
  */
  $paramToken = $params['data']['token'];
  if( in_array($paramToken,$tokens)){

  	/*
	 Return status to socket by Http response to 
  	*/
  	$statusCode = 200;

  	switch ($params['type']) {

  		case 'server/join':
  		case 'server/leave':
  			$params['data']['username'] = $users[$paramToken];
  			break;
  		
  		default:
  			# code...
  			break;
  	} 
  	
  }

  http_response_code($statusCode);
  header('Content-type: application/json');
  echo(json_encode($params));
?>
