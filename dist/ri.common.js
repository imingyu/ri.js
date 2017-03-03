'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var version = "0.1.0";

var VERSION = version;

/**
 * 定义一个拦截器集合
 * @param {string} id 
 */
function RequestInterceptorSet(id) {
    this.id = id;
    var $set = [];

    this.has = function (name$$1) {
        return $set.some(function (item) {
            return item.name === name$$1;
        });
    };

    this.get = function (name$$1) {
        return $set.find(function (item) {
            return item.name === name$$1;
        });
    };

    this.append = function (name$$1, handler) {
        var item = this.get(name$$1);
        if (item) {
            item.handler = handler;
        } else {
            $set.push({
                name: name$$1,
                handler: handler,
                enabled: true
            });
        }
        return this;
    };

    this.remove = function (name$$1) {
        var item = this.get(name$$1);
        if (item) {
            $set.splice($set.indexOf(item), 1);
        }
        return item;
    };

    this.disable = function (name$$1) {
        var item = this.get(name$$1);
        if (item) {
            item.enabled = false;
        }
        return this;
    };

    this.enable = function (name$$1) {
        var item = this.get(name$$1);
        if (item) {
            item.enabled = true;
        }
        return this;
    };

    this.insertBefore = function (beforeName, name$$1, handler) {
        var beforeItem = this.get(beforeName),
            item = this.get(name$$1);
        if (!beforeItem) {
            this.append(name$$1, handler);
            return this;
        }
        var i = $set.indexOf(beforeItem);
        if (item) {
            var itemIndex = $set.indexOf(item);
            item.handler = handler ? handler : item.handler;
            $set.splice(i, 0, item);
            $set.splice(itemIndex, 1);
        } else {
            item = {
                name: name$$1,
                handler: handler,
                enabled: true
            };
            $set.splice(i, 0, item);
        }
        return this;
    };

    this.parallel = function () {
        var args = Array.from(arguments),
            ignoreInterceptors = args[0];
        args.splice(0, 1); //排除第一个参数
        return Promise.all($set.filter(function (item) {
            return item.enabled && ignoreInterceptors.indexOf(item.name) === -1;
        }).map(function (item) {
            return item.handler.apply(item.context || null, args);
        }));
    };

    this.serial = function () {
        var args = Array.from(arguments),
            ignoreInterceptors = args[0];
        args.splice(0, 1); //排除第一个参数

        var items = $set.filter(function (item) {
            return item.enabled && ignoreInterceptors.indexOf(item.name) === -1;
        }).map(function (item) {
            return item.handler;
        });

        var handler = items.shift(),
            result = handler.apply(null, args);
        while (handler = items.shift()) {
            result = result.then(handler);
        }
        return result;
    };
}

/**
 * Request工厂
 * @param {RequestInterceptorSet} interceptor 
 */
function RequestFactory(interceptor) {
    this.$interceptor = interceptor;
    /**
     * 创建一个Request
     * requestHandler：真实的API处理函数
     * ignoreInterceptors：需要排除的过滤器列表，传入字符串数组
     */
    this.createRequest = function (requestHandler, ignoreInterceptors) {
        ignoreInterceptors = ignoreInterceptors || []; /*before：代表整个before过滤器都不走，after同理 */
        var fac = this,
            itr = fac.$interceptor,
            before = itr.before && itr.before.parallel && ignoreInterceptors.indexOf('before') == -1 ? itr.before : {
            parallel: function parallel() {
                return Promise.resolve();
            }
        },
            after = itr.after && itr.after.serial && ignoreInterceptors.indexOf('after') == -1 ? itr.after : {
            serial: function serial(ignoreInterceptors, apiPromise) {
                return apiPromise;
            }
        };
        return function () {
            var args = Array.from(arguments);
            return before.parallel.apply(before, [ignoreInterceptors].concat(args)).then(function () {
                return after.serial.call(after, ignoreInterceptors, requestHandler.apply(null, args));
            });
        };
    };
}

exports.VERSION = VERSION;
exports.RequestInterceptorSet = RequestInterceptorSet;
exports.RequestFactory = RequestFactory;
//# sourceMappingURL=ri.common.js.map
