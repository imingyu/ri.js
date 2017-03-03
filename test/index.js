var chai = require('chai'),
    assert = chai.assert,
    RI = require('../dist/ri.common'),
    RequestInterceptorSet = RI.RequestInterceptorSet,
    RequestFactory = RI.RequestFactory;

describe("RequestInterceptorSet", () => {
    var s1 = new RequestInterceptorSet('s1');
    [1, 2, 3, 4, 5, 6, 7].forEach((item) => {
        s1.append(item, function () { });
    });
    it('has', function () {
        assert.isTrue(s1.has(1));
        assert.isTrue(!s1.has(200));
    });
    it('get', function () {
        assert.isTrue(s1.get(1).name === 1);
        assert.isTrue(s1.get(3).name === 3);
        assert.isTrue(!s1.get(300));
    });
    it('remove', function () {
        assert.isTrue(s1.remove(3).name === 3);
        assert.isTrue(!s1.get(3));
    });
    it('append', function () {
        assert.isTrue(s1.append(10, function () { }) === s1);
        assert.isTrue(s1.get(10).name === 10);
    });
    it('disable', function () {
        s1.disable(10);
        assert.isTrue(s1.get(10).enabled === false);
    });
    it('enable', function () {
        s1.enable(10);
        assert.isTrue(s1.get(10).enabled);
    });

    it('parallel', () => {
        var s2 = new RequestInterceptorSet('s2').append('s201', function () {
            assert.isTrue(true);
            return 1;
        }).append('s202', function () {
            assert.isTrue(true);
            return new Promise((r, j) => {
                assert.isTrue(true);
                setTimeout(() => {
                    j("error");
                }, 0.2 * 1000);
            });
        }).append('s203', function () {
            assert.isTrue(true);
            return new Promise((r, j) => {
                assert.isTrue(true);
                setTimeout(() => {
                    r("success");
                }, 0.3 * 1000);
            }).then((msg) => {
                return msg + "--";
            });
        }).append('s204', function () {
            assert.isTrue(true);
            return new Promise((r, j) => {
                assert.isTrue(true);
                setTimeout(() => {
                    j("error2");
                }, 0.3 * 1000);
            });
        });

        s2.parallel().then((msg) => {
            assert.isTrue(false);
        }).catch((msg) => {
            assert.isTrue(msg === 'error');
        });

        s2.disable('s202');
        s2.parallel().then((msg) => {
            assert.isTrue(msg === 'success');
        }).catch((msg) => {
            assert.isTrue(false);
        });
    })
});