const http = require('http')
const port = 8081

const requestHandler = (request, response) => {
	var d = new Date();
  response.end(d.toString())
}

const server = http.createServer(requestHandler)

server.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }
  console.log(`server is listening on ${port}`)
})
