var isInContainer = function (one, containerSize, pad) {
    var pos = one.pos, size = one.size;
    return (pos[0] >= pad && (pos[0] + size[0] + pad <= containerSize[0]) && pos[1] >= pad && (pos[1] + size[1] + pad <= containerSize[1]));
};
var isCollision = function (one, list, container, pad) { // 检查能否放在里面
    if (!isInContainer(one, container.size, pad)) return true; // 不在容器里面，不行
    var pos = one.pos, size = one.size, cx1, cx2, cy1, cy2, w1, h1, w2, h2;
    for (var i = 0; i < list.length; i++) {
        var l = list[i];
        w1 = (size[0] >> 1);
        h1 = (size[1] >> 1);
        w2 = (l.size[0] >> 1);
        h2 = (l.size[1] >> 1);
        cx1 = pos[0] + w1;
        cy1 = pos[1] + h1;
        cx2 = l.pos[0] + w2;
        cy2 = l.pos[1] + h2;

        if (Math.abs(cx1 - cx2) < (w1 + w2) && Math.abs(cy1 - cy2) < (h1 + h2)) return true;
    }
    return false; // 都没有冲突
};
var place = function (list, container, pad) {
    var puttedList = [];
    pad = typeof(pad) == 'undefined' ? 2 : Math.abs(pad); // 空间间隔2个像素
    for (var i = 0; i < list.length; i++) {
        list[i].ok = false;
        list[i].pos = [0, 0];
    }
    for (var i = 0; i < list.length; i++) {
        var one = list[i];
        if (i == 0) {
            one.pos[0] = pad;
            one.pos[1] = pad;
            if (isCollision(one, puttedList, container, pad)) break; // 检查第一个，有冲突就断开了
            one.ok = true;
            puttedList.push(one);
            continue;
        }
        var noCollision = false;
        for (var j = 0; j < puttedList.length; j++) {
            var o = puttedList[j];
            // 放在右边
            one.pos[0] = o.pos[0] + o.size[0] + pad;
            one.pos[1] = o.pos[1];
            if (!isCollision(one, puttedList, container, pad)) { // 如果没有冲突就表示可以放了
                noCollision = true;
                break;
            }
            // 放在下边
            one.pos[0] = o.pos[0];
            one.pos[1] = o.pos[1] + o.size[1] + pad;
            if (!isCollision(one, puttedList, container, pad)) { // 如果没有冲突就表示可以放了
                noCollision = true;
                break;
            }
        }
        if (!noCollision) break;
        one.ok = true;
        puttedList.push(one);
    }
    return list;
};
var jsonFormator2 = function (theJson, tab) {
    var tabBase = '    ';
    var json = "// each data is [x, y, width, height]\n{\n";
    var notFirst = false;
    for (var i in theJson) {
        var one = theJson[i];
        if (notFirst) json += ",\n";
        notFirst = true;
        json += tabBase + '"' + i + '": [';
        json += one.x + ", ";
        json += one.y + ", ";
        json += one.width + ", ";
        json += one.height;
        json += ']';
    }
    json += "\n}";
    return json;
};
var jsonFormator1 = function (theJson, tab) {
    var tabBase = '    ';
    var json = "{\n";
    for (var i in theJson) {
        var one = theJson[i];
        if (json != "{\n") json += ",\n";
        json += tabBase + '"' + i + '": {';
        json += '"x": ' + one.x + ",";
        json += '"y": ' + one.y + ",";
        json += '"width": ' + one.width + ",";
        json += '"height": ' + one.height;
        json += '}';
    }
    json += "\n}";
    return json;
};
var jsonFormator3 = function (theJson, tab) {
    var tabBase = '    ';
    var json = '', i, rc, text = '';
    tab = tab || '';
    if (typeof theJson == 'object') {
        if (theJson instanceof Array) { // 数组
            for (i = 0; i < theJson.length; i++) {
                if (text.length > 0) {
                    text += ",\n";
                }
                text += tab + tabBase + jsonFormator3(theJson[i], tab + tabBase);
            }
            json += "[\n";
            json += text;
            json += '\n' + tab + ']';
        } else { // 对象
            for (i in theJson) {
                if (text.length > 0) {
                    text += ",\n";
                }
                text += tab + tabBase + '"' + i + '":' + jsonFormator3(theJson[i], tab + tabBase);
            }
            json += "{\n";
            json += text;
            json += '\n' + tab + '}';
        }
    } else {
        if (typeof(theJson) == 'number') json += theJson;
        else json += '"' + theJson + '"';
    }
    return json;
};
var jsonFormators = [jsonFormator1, jsonFormator2, jsonFormator3];
var app = new Vue({
    el: '#main',
    data: {
        notice: 'drop pictures to here',
        width: 640,
        height: 640,
        activeWidth: 640,
        activeHeight: 640,
        pad: 0,
        list: [],
        output: '',
        style: 1
    },
    methods: {
        itemUp: function (idx) {
            if (idx < 1) return;
            var l = this.list[idx - 1];
            this.list[idx - 1] = this.list[idx];
            this.list[idx] = l;
            this.upateCanvas(); // list will be udpate inside
        },
        itemDown: function (idx) {
            if (idx >= this.list.length - 1) return;
            var l = this.list[idx + 1];
            this.list[idx + 1] = this.list[idx];
            this.list[idx] = l;
            this.upateCanvas(); // list will be udpate inside
        },
        itemDel: function (idx) {
            this.list.splice(idx, 1);
            this.upateCanvas();
        },
        changeSize: function () {
            if (this.width < 1 || this.width > 1024 * 10) return;
            if (this.height < 1 || this.height > 1024 * 10) return;
            if (this.pad < 0 || this.pad > 100) this.pad = 0;

            var theCanvas = document.getElementById('theCanvas');
            theCanvas.width = this.activeWidth = this.width;
            theCanvas.height = this.activeHeight = this.height;
            this.upateCanvas();
        },
        upateCanvas: function () { // 更新canvas上的内容
            var container = {
                size: [this.activeWidth, this.activeHeight]
            };
            var pad = this.pad || 0;
            var data = {};
            var newList = place(this.list, container, pad);
            this.list = newList;
            this.list.push(1);
            this.list.pop();

            var ctx = document.getElementById('theCanvas').getContext("2d");
            ctx.clearRect(0, 0, this.activeWidth, this.activeHeight);
            for (var i = 0; i < newList.length; i++) {
                var one = newList[i];
                var img = new Image();
                img.src = one.imgUrl;
                ctx.drawImage(img, 0, 0, one.size[0], one.size[1], one.pos[0], one.pos[1], one.size[0], one.size[1]);

                data[one.name] = {
                    x: one.pos[0],
                    y: one.pos[1],
                    width: one.size[0],
                    height: one.size[1]
                };
            }
            this.output = jsonFormators[this.style - 1](data);
            this.saveData();
        },
        pushImage: function (file) {
            this.list.push(file);
            this.upateCanvas();
        },
        getImageSize: function (target, cb) {
            var img = document.createElement('img');
            img.src = target;
            img.onload = function () {
                img.onload = null;
                cb({width: img.naturalWidth, height: img.naturalHeight});
            }

        },
        clean: function () {
            this.list = [];
        },
        autoRange: function () {
            var list = this.list, newList = [];
            if (list.length < 1) return;
            newList.push(list[0]);
            for (var i = 1; i < list.length; i++) {
                var one = list[i];
                var unChecked = true;
                for (var j = 0; j < newList.length; j++) {
                    if (one.size[0] > newList[j].size[0]) { // 以宽度为标准排序
                        newList.splice(j, 0, one);
                        unChecked = false;
                        break;
                    }
                }
                if (unChecked) {
                    newList.push(one);
                }
            }

            this.list = newList;
            this.upateCanvas();
        },
        getFiles: function (event) {
            var fileList = event.dataTransfer.files; //获取文件对象
            var that = this;
            console.log(fileList);
            for (var i = 0; i < fileList.length; i++) {
                if (fileList[i].type.indexOf('image') === -1) continue;

                var reader = new FileReader();
                reader.file = fileList[i];
                reader.readAsDataURL(reader.file);
                reader.onload = function () {
                    var finalResult = this.result; // 压缩
                    var theName = this.file.name;
                    that.getImageSize(finalResult, function (size) {
                        var name = theName.split('.');
                        name.splice(name.length - 1, 1);
                        that.pushImage({
                            imgUrl: finalResult,
                            name: name.join('.'),
                            size: [size.width, size.height],
                            sizeTxt: size.width + ' * ' + size.height //  + '/' + this.file.type.replace('image/', '')
                        });
                    });

                };
            }
        },
        select: function (style) {
            if (this.style != style) {
                this.style = style;
                this.upateCanvas();
            }
        },
        saveData: function () {
            if (window.localStorage) {
                localStorage.data = JSON.stringify({
                    width: this.activeWidth,
                    height: this.activeHeight,
                    pad: this.pad,
                    style: this.style
                });
            }
        }
    },
    mounted: function () {
        var that = this;
        if (window.localStorage && localStorage.data) {
            try {
                var data = JSON.parse(localStorage.data);
                this.width = this.activeWidth = data.width || 640;
                this.height = this.activeHeight = data.height || 640;
                this.pad = data.pad || 0;
                this.style = data.style || 1;
                this.changeSize();
            } catch (e) {

            }
        }
        document.getElementById('main').style.display = 'flex'; // show it
        new Clipboard('#copy', { // 实现剪切板
            text: function () {
                return that.output;
            }
        }).on('success', function () {
                alert('done!');
            });
    }
});