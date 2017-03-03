/**
 * 定义一个拦截器集合
 * @param {string} id 
 */
function RequestInterceptorSet(id) {
    this.id = id;
    var $set = [];

    this.has = function (name) {
        return $set.some((item) => {
            return item.name === name;
        });
    }

    this.get = function (name) {
        return $set.find((item) => {
            return item.name === name;
        })
    }

    this.append = function (name, handler) {
        var item = this.get(name);
        if (item) {
            item.handler = handler;
        } else {
            $set.push({
                name: name,
                handler: handler,
                enabled: true
            });
        }
        return this;
    }

    this.remove = function (name) {
        var item = this.get(name);
        if (item) {
            $set.splice($set.indexOf(item), 1);
        }
        return item;
    }

    this.disable = function (name) {
        var item = this.get(name);
        if (item) {
            item.enabled = false;
        }
        return this;
    }

    this.enable = function (name) {
        var item = this.get(name);
        if (item) {
            item.enabled = true;
        }
        return this;
    }

    this.insertBefore = function (beforeName, name, handler) {
        var beforeItem = this.get(beforeName),
            item = this.get(name);
        if (!beforeItem) {
            this.append(name, handler);
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
                name: name,
                handler: handler,
                enabled: true
            };
            $set.splice(i, 0, item);
        }
        return this;
    }

    this.parallel = function () {
        var args = Array.from(arguments),
            ignoreInterceptors = args[0];
        args.splice(0, 1);//排除第一个参数
        return Promise.all($set.filter((item) => {
            return item.enabled && ignoreInterceptors.indexOf(item.name) === -1;
        }).map((item) => {
            return item.handler.apply(item.context || null, args);
        }));
    }

    this.serial = function () {
        var args = Array.from(arguments),
            ignoreInterceptors = args[0];
        args.splice(0, 1);//排除第一个参数

        var items = $set.filter((item) => {
            return item.enabled && ignoreInterceptors.indexOf(item.name) === -1;
        }).map((item) => {
            return item.handler;
        });

        var handler = items.shift(),
            result = handler.apply(null, args);
        while (handler = items.shift()) {
            result = result.then(handler);
        }
        return result;
    }
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
        ignoreInterceptors = ignoreInterceptors || [];/*before：代表整个before过滤器都不走，after同理 */
        var fac = this,
            itr = fac.$interceptor,
            before = itr.before && itr.before.parallel && ignoreInterceptors.indexOf('before') == -1 ? itr.before : {
                parallel: function () {
                    return Promise.resolve();
                }
            },
            after = itr.after && itr.after.serial && ignoreInterceptors.indexOf('after') == -1 ? itr.after : {
                serial: function (ignoreInterceptors, apiPromise) {
                    return apiPromise;
                }
            };
        return function () {
            var args = Array.from(arguments);
            return before.parallel.apply(before, [ignoreInterceptors].concat(args)).then(() => {
                return after.serial.call(after, ignoreInterceptors, requestHandler.apply(null, args));
            });
        }
    }
}