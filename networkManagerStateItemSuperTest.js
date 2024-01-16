export class NetworkManagerStateItemSuper {

    connect(signal, callback) {
        console.debug(`object: ${this._id}; connected handler: ${this._handlerId}`);
    }

    disconnect(handlerId) {
        console.debug(`object: ${this._id}; disconnecting handler: ${this._handlerId}`);
    }

    emit(signal) {
        console.log(`emitting signal: ${signal}`);
    }

}
