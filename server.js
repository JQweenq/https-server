/* импорты необходимых либ */
const http2 = require('http2')
const fs = require('fs')
const join = require('path').join
const host = require('os').hostname()

/* импорт конфиг файла. да, да, лучше использовать dotenv, но незачем усложнять */
const config = require('./config.json')

const log = console.log
class Server{

	createHeaders(){ // метод для создания заголовка ответа для клиета
		this.headers = {
			'status': this.status, // присваиваем значение статуса
			'content-type': this.contentType // присваиваем значение типа и кодировки отправляемого файла
		}
	}

	checkPath(headers){
		

		if(headers[':path'] == '/') {
			var path = join(process.cwd(), config.serverTree, 'index.html') // при запросе на 'https://localhost/' мы погружаем начальную страницу
			this.contentType = 'text/html; charset=utf-8' // тип файла
		}
		else {
			this.status = 204 // выкидываем код состояния 204 (нет содержимого)
			this.contentType = null // тип ответв
			return null // выходим из тела метода и возвращаем null
		}

		try { fs.accessSync(path, fs.F_OK) } // проверка на существования файла

		catch (err) { // при отсутствии файла и др ошибках
			this.status = 404 // выкидываем код состояния 404 (не найдено)
			return null // выходим из тела метода и возвращаем null
		}

		this.status = 200 // все ок, код состояния тоже - ок (200)
		return path
		
	}

	loadFile(path){ // подгрузка файла

		path = this.checkPath(path) // проверяем запрос

		this.createHeaders() // создаем заголовок
		

		if (path != null) this.file = fs.readFileSync(path, 'utf-8') // если файл прошел проверку, то загружаем его
		else this.file = null // если файл не прошел проверку, то возвращаем null
	}
}

vars = new Server() // создаем экземпляр класса

const server = http2.createSecureServer({
	key: fs.readFileSync(config.opensslKey), // загружаем ключ
	cert: fs.readFileSync(config.opensslCert) // загружаем сертификат
})

server.on('error', (err) => console.error(err)) // если есть какая-то ошибка, то выводим ее в консоль

server.on('stream', (stream, headers) => { // слушаем 

	vars.loadFile(headers) // загружаем файл

	stream.respond(vars.headers) // отправляем заголовок
	
	stream.end(vars.file) // отправляем запрашиваемый файл
})

server.listen(config.port, config.host || host, () => {
	log(`сервер запущен, на https://${config.host || host}:${config.port}`)
}) // запускаем сервер на порте и хосте 