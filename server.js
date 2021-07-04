const http2 = require('http2');
const fs = require('fs');

config = JSON.parse(fs.readFileSync('config.json'));

class Server{

	createHeaders(){
		this.headers = {
			':status': this.status,
			'content-type': `${this.type}/${this.extension}; charset=${this.encoding.toLowerCase()}`,
		};
	}

	checkPath(path){
		if (path == '/') path = `${process.cwd()}/${config['serverTree']}/index.html`;
		else path = `${process.cwd()}/Files${path}`;

		this.extension = path.toLowerCase().split('.')[1];

		if (this.extension == 'html' | 'css' | 'js' | 'txt') {
			this.type = 'text';
			this.encoding = 'UTF-8';
		}
		if (this.extension == 'txt') {
			this.type = 'text';
			this.extension = 'plain';
		}

		try { fs.accessSync(path, fs.F_OK);}

		catch (err) {
			this.status = 404;
			return null;
		}

		this.status = 200;
		return path;
		
	}

	loadFile(path){
		path = this.checkPath(path);

		this.createHeaders();
		

		if (path != null) this.file = fs.readFileSync(path, 'utf-8');
		else this.file = null;
	}
}

vars = new Server();

const server = http2.createSecureServer({
	key: fs.readFileSync(config['opensslKey']),
	cert: fs.readFileSync(config['opensslCert'])
});

server.on('error', (err) => console.error(err));

server.on('stream', (stream, headers) => {
	// stream is a Duplex

	vars.loadFile(headers[':path']);

	stream.respond(vars.headers);
	
	stream.end(vars.file);
});

server.on('request', (reqv, resp) =>{

});

server.listen(config['port']);