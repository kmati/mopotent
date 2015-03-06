/*
 * Author: Kimanzi Mati
 * Version: 0.1
 * Description: Message based interaction between multiple components (and sometimes services).
 * Depends On:
 * - jQuery.js
 * - mustache.js
 * - messageBus.js
 */
var manners =  {
    sendRequest: function (isJson, method, url, data, fnSuccess, fnError, requestId) {
        var jqXHR = $.ajax({
            type : method.toUpperCase(),
            url : url,
            data : data,
            dataType: isJson ? 'json' : 'text'
        })
        .done(function (responseData) {
            fnSuccess(responseData, requestId);
        })
        .error(function () {
            if (fnError) {
                fnError(jqXHR.responseText, requestId);
            } else {
                alert(jqXHR.status + ' ' + jqXHR.statusText + '\n\n' + jqXHR.responseText);
            }
        });
    },

    getData: function (url, messageType) {
        var self = this;
        this.sendRequest(true, "GET", url, null, function (data, requestId) {
            messageBus.publish(messageType, data);
        }, function (err) {
            messageBus.publish(messageType + "-error", err);
        }, messageType);
    },

    putData: function (url, parmsObj, messageType) {
        var self = this;
        this.sendRequest(true, "PUT", url, parmsObj, function (data, requestId) {
            messageBus.publish(messageType, data);
        }, function (err) {
            messageBus.publish(messageType + "-error", err);
        }, messageType);
    },

    postData: function (url, parmsObj, messageType) {
        var self = this;
        this.sendRequest(true, "POST", url, parmsObj, function (data, requestId) {
            messageBus.publish(messageType, data);
        }, function (err) {
            messageBus.publish(messageType + "-error", err);
        }, messageType);
    },

    deleteData: function (url, messageType) {
        var self = this;
        this.sendRequest(true, "DELETE", url, null, function (data, requestId) {
            messageBus.publish(messageType, data);
        }, function (err) {
            messageBus.publish(messageType + "-error", err);
        }, messageType);
    }
};
    
var mopotent = {
    controllers: [],

    // Non visual controllers have no views and therefore this method always returns undefined!
    getController: function (viewEle) {
        if (!viewEle) return undefined;
        for (var c = 0; c < this.controllers.length; c++) {
            var controller = this.controllers[c];
            if (controller.view === viewEle) return controller;
        }
        return undefined;
    },

    // This method is to be called when you want to create a controller.
    // viewEle  : The element that is the container for the view
    setController: function (viewEle) {
        var controller = this.getController(viewEle);
        if (!controller) {
            controller = {
                view: viewEle,
                addSubscription: function (messageType, messageHandler) {
                    var isAlreadySubscribedInMessageBus = this[messageType] && this[messageType].toString() === messageHandler.toString();

                    // allow subsequent invocations of addSubscription to modify the subscribed message handler
                    this[messageType] = messageHandler;

                    // but do NOT add a duplicate subscription to the messageBus!!
                    if (!isAlreadySubscribedInMessageBus) {
                        messageBus.subscribe(messageType, this, this[messageType]);
                    }
                }
            };
            for (var key in manners) {
                controller[key] = manners[key];
            }
            this.controllers.push(controller);
        }
        //this.addController(controller);
        return controller;
    },
    
    isInited: false,

    buildControllerShowHide: function (parentElement, messageTypeAttr, isShow) {
        var viewElements = parentElement ? $(parentElement).find("[" + messageTypeAttr + "]").not("[__has" + messageTypeAttr + "]") : $("[" + messageTypeAttr + "]").not("[__has" + messageTypeAttr + "]");
        function fnShow(message) {
            $(this.view).show();
        }

        function fnHide(message) {
            $(this.view).hide();
        }
        for (var c = 0; c < viewElements.length; c++) {
            var viewEle = viewElements[c];
            var messageTypes = $(viewEle).attr(messageTypeAttr).split(',');
            for (var m = 0; m < messageTypes.length; m++) {
                var messageType = messageTypes[m].trim();
                var controller = this.setController(viewEle);
                controller.addSubscription(messageType, isShow ? fnShow  : fnHide);
            }
        }
        viewElements.attr("__has" + messageTypeAttr, "true");
        return viewElements.toArray();
    },

    buildCustomController: function (parentElement, messageTypeAttr, fnImplementation) {
        var viewElements = parentElement ? $(parentElement).find("[" + messageTypeAttr + "]").not("[__has" + messageTypeAttr + "]") : $("[" + messageTypeAttr + "]").not("[__has" + messageTypeAttr + "]");
        for (var c = 0; c < viewElements.length; c++) {
            var viewEle = viewElements[c];
            viewEle.template = $(viewEle).html();
            var messageTypes = $(viewEle).attr(messageTypeAttr).split(',');
            for (var m = 0; m < messageTypes.length; m++) {
                var messageType = messageTypes[m].trim();
                var controller = this.setController(viewEle);
                fnImplementation(controller, messageType);
            }
        }
        viewElements.attr("__has" + messageTypeAttr, "true");
        return viewElements.toArray();
    },

    loadControllerExtension: function (controller, url, fnSuccess, fnError) {
        manners.sendRequest(false, "GET", url, null,
            function (responseData, requestId) {
                window.eval("mopotent.extension = " + responseData + ';');
                controller.extension = mopotent.extension;
                delete mopotent.extension;
                controller.extension(controller); // invoke the extension function the first time!
                fnSuccess(responseData, requestId);
            },
            fnError,
            url);
    },

    // urlData   : An object which has 2 properties:
    //              - view : The url to the view html file
    //              - controller : The url to the controller js file (OPTIONAL)
    // callback : void function (viewData, err)
    //              where viewData has 2 properties:
    //              - url : The url from which the view elements were loaded
    //              - viewElements  : The view elements
    loadView: function (parentElement, urlData, callback) {
        var self = this;
        manners.sendRequest(false, "GET", urlData.view, null, function (data, requestId) {
            $(parentElement).append(data);
            var viewData = {
                url: urlData.view,
                viewElements: self.bindViews(parentElement)
            };
console.log("[loadView] " + viewData.url + " | viewData.viewElements.length = " + viewData.viewElements.length);
            viewData.controller = self.getController(viewData.viewElements[0]);
            if (urlData.controller) {
                self.loadControllerExtension(viewData.controller, urlData.controller, function (extData, extRequestId) {
                    callback(viewData);
                }, function (err) {
                    console.error("[mopotent.loadView] Error = ",err);
                    callback(null, err);
                }, urlData.controller);
            } else {
                callback(viewData);
            }
        }, function (err) {
            console.error("[mopotent.loadView] Error = ",err);
            callback(null, err);
        }, urlData.view);
    },

    // urlDataArr   : An array of url data objects, where each url data object has 2 properties:
    //              - view : The url to the view html file
    //              - controller : The url to the controller js file (OPTIONAL)
    // callback : void function (viewDataArr, err)
    //              where viewDataArr is an array of viewData objects; where each viewData object has 2 properties:
    //              - url : The url from which the view elements were loaded
    //              - viewElements  : The view elements
    loadViews: function (parentElement, urlDataArr, callback) {
        var viewsCount = urlDataArr.length;
        var viewDataArr = [];
        function onViewsLoaded(viewData, err) {
            if (err) {
                callback(null, err);
                return;
            }
            viewDataArr.push(viewData);
            viewsCount--;
            if (viewsCount < 1) {
                callback(viewDataArr);
            }
        }
        for (var v = 0; v < urlDataArr.length; v++) {
            this.loadView(parentElement, urlDataArr[v], onViewsLoaded);
        }
    },

    bindViews: function (parentElement) {
        var viewElements = this.buildControllerShowHide(parentElement, '-onmessageshow', true);
        viewElements.pushRangeUnique(this.buildControllerShowHide(parentElement, '-onmessagehide', false));

        viewElements.pushRangeUnique(this.buildCustomController(parentElement, '-onmessage', function (controller, messageType) {
            controller.addSubscription(messageType, function (message) {
                this.message = message;
                var template = this.view.template;
                var dataVar = $(this.view).attr('-datavar');
                var obj = {};
                obj[dataVar] = message;
                
                var str = template;
                var find = '\{\{' + dataVar + '\}\}';
                var re = new RegExp(find, 'g');
                str = str.replace(re, 'this.$controller.message');

                var html = Mustache.render(str, obj);
                $(this.view).html(html);
                if (this.extension) {
                    this.extension(this); // invoke the extension function again since the view has changed!
                }

                this.view.$controller = controller;
                var descendants = $(this.view).find('*');
                for (var d = 0; d < descendants.length; d++) {
                    var descendant = descendants[d];
                    descendant.$controller = controller;
                }
            });
        }));

        viewElements.pushRangeUnique(this.buildCustomController(parentElement, '-onmessagerepeat', function (controller, messageType) {
            controller.addSubscription(messageType, function (message) {
                this.message = message;
                var template = this.view.template;
                var dataVar = $(this.view).attr('-datavar');
                var iteratorVar = $(this.view).attr('-iteratorvar');
                var content = "";
                for (var i = 0; i < message.length; i++) {
                    var obj = {};
                    obj[dataVar] = message;
                    obj[iteratorVar] = message[i];
                    obj[iteratorVar].$index = i;
                
                    var str = template;

                    var find = '\{\{' + dataVar + '\}\}';
                    var re = new RegExp(find, 'g');
                    str = str.replace(re, 'this.$controller.message');

                    var find = '\{\{' + iteratorVar + '\}\}';
                    var re = new RegExp(find, 'g');
                    str = str.replace(re, 'this.$controller.message[' + i + ']');

                    var html = Mustache.render(str, obj);
                    content += html;
                }
                $(this.view).html(content);
                if (this.extension) {
                    this.extension(this); // invoke the extension function again since the view has changed!
                }

                this.view.$controller = controller;
                var descendants = $(this.view).find('*');
                for (var d = 0; d < descendants.length; d++) {
                    var descendant = descendants[d];
                    descendant.$controller = controller;
                }
            });
        }));
        return viewElements;
    },
    
    init: function () {
        if (this.isInited) return;
        this.bindViews(null);
        this.isInited = true;
    }
};

$(function () {
    mopotent.init();
});
