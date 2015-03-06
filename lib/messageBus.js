/*
 * This is the messagebus that is a pub/sub mechanism for signaling between components.
 */
var messageBus = {
	// The subscriptions in the message bus
	subscriptions: {},
	
	// Publishes a message asynchronously to the subscribed listeners
	// messageType	: The type of the message
	// message		: The message data
	publish: function (messageType, message) {
		var self = this;
		window.setTimeout(function () {
			var infos = self.subscriptions.all.union(self.subscriptions[messageType]);
			for (var f = 0; f < infos.length; f++) {
				var info = infos[f];
				if (info.fn) {
					info.fn.call(info.context, message);
				} else {
					console.error("[messagebus | Error] This object does not have a handler for '" + messageType + "' messages. The object is: " + JSON.stringify(info.context));
				}
			}
		}, 0);
	},
	
	// Subscribes a listener to listen for messages of a specific type
	// messageType	: The type of the messages to listen for
	// context		: The context (i.e. the object) in which the callback function is to be invoked; i.e. who owns the callback function?
	// fnCallback	: The callback function to be invoked when a message is published | void function (message)
	subscribe: function (messageType, context, fnCallback) {
		if (typeof messageType === "undefined" || messageType === null) messageType = "all";
		if (!this.subscriptions.all) this.subscriptions.all = [];
		if (messageType.toLowerCase() === "all") {
			this.subscriptions.all.pushUnique({ context: context, fn: fnCallback });
		} else {
			if (!this.subscriptions[messageType]) this.subscriptions[messageType] = [];
			this.subscriptions[messageType].pushUnique({ context: context, fn: fnCallback });
		}
	}
};
