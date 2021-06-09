# Textric

Next-Generation Messaging Service with a focus on Privacy

## Installing

After cloning, run `npm install` and `npm run build` to build the distributable:

```shell
git clone https://github.com/alexhrao/textric.git
cd textric
npm install
npm run build
# dist will now be a folder
```

## Testing

Testing is handled via `mocha` and `chai`. To test, simply build the project and run the test script:

```shell
npm run build && npm test
```

## Textric Server

The Textric Server is a cross-platform Node.JS program that uses WebSockets to communicate with different devices. After installing, simply run `npm start`:

```shell
# From installation...
git clone https://github.com/alexhrao/textric.git
cd textric
npm install
npm run build
# Start the server
npm start
```

The server takes a variety of options. To see them, run `npm start -- --help`.

### Server Port

The `--server-port` option specifies the port to run the HTTP API from; if not given, the environment variable `$SERVER_PORT` is used. If this variable is not present, port 3000 is used.

### Socket Port

The `--socket-port` option specifies the port to run the WebSocket server from; if not given, the value of the environment variable `$SOCKET_PORT` is used. If this variable isn't present, port 8080 is used.

### Mongo Credentials

Credentials for MongoDB can also be given:

-   `--mongo-user` or `$MONGO_USER` for the MongoDB username
-   `--mongo-pass` or `$MONGO_PASS` for the MongoDB password
-   `--mongo-url` or `$MONGO_URL` for the MongoDB URL (i.e., `example.com` or `127.0.0.1`)
