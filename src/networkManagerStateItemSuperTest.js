export class NetworkManagerStateItemSuper {
    // eslint-disable-next-line no-unused-vars
    connect(signal, callback) {
        console.debug(`object: ${this._id}; connected handler: ${this._handlerId}`);
    }

    // eslint-disable-next-line no-unused-vars
    disconnect(handlerId) {
        console.debug(`object: ${this._id}; disconnecting handler: ${this._handlerId}`);
    }

    emit(signal) {
        console.log(`emitting signal: ${signal}`);
    }
}
