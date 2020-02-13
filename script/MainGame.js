"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
//メインのゲーム画面
var MainGame = /** @class */ (function (_super) {
    __extends(MainGame, _super);
    function MainGame(scene) {
        var _this = this;
        var tl = require("@akashic-extension/akashic-timeline");
        var timeline = new tl.Timeline(scene);
        var sizeW = 500;
        var sizeH = 360;
        _this = _super.call(this, { scene: scene, x: 0, y: 0, width: sizeW, height: sizeH, touchable: true }) || this;
        var waku = new g.Sprite({
            scene: scene,
            src: scene.assets["waku"]
        });
        _this.append(waku);
        //プレイヤー
        var player = new g.E({
            scene: scene,
            x: 230,
            y: 320,
            width: 30,
            height: 30
        });
        _this.append(player);
        var sprPlayer = new g.FrameSprite({
            scene: scene,
            src: scene.assets["player"],
            x: -5,
            y: -5,
            width: 40,
            height: 40,
            frames: [0, 1]
        });
        player.append(sprPlayer);
        //敵
        var enemys = [];
        for (var y = 0; y < 4; y++) {
            for (var x = 0; x < 10; x++) {
                var enemy = new Enemy(scene, y);
                _this.append(enemy);
                enemys.push(enemy);
            }
        }
        //UFO
        var ufo = new g.FrameSprite({
            scene: scene,
            x: 0,
            y: 3,
            width: 75,
            height: 45,
            src: scene.assets["ufo"],
            frames: [0, 1],
            interval: 500
        });
        ufo.hide();
        ufo.start();
        _this.append(ufo);
        //壁
        var walls = [];
        for (var i = 0; i < 3; i++) {
            for (var y = 0; y < 2; y++) {
                for (var x = 0; x < 3; x++) {
                    var wall = new g.Sprite({
                        scene: scene,
                        x: (x * 30) + (i * 150) + 60,
                        y: (y * 15) + 280,
                        src: scene.assets["wall"]
                    });
                    _this.append(wall);
                    walls.push(wall);
                }
            }
        }
        //プレイヤーの弾
        var shots = [];
        for (var i = 0; i < 3; i++) {
            var shot = new g.Sprite({
                scene: scene,
                src: scene.assets["shot"]
            });
            shot.hide();
            _this.append(shot);
            shots.push(shot);
        }
        //敵の弾
        var enemyShots = [];
        for (var i = 0; i < 10; i++) {
            var shot = new g.Sprite({
                scene: scene,
                src: scene.assets["eshot"]
            });
            shot.hide();
            _this.append(shot);
            enemyShots.push(shot);
        }
        //爆発エフェクト用
        var effects = [];
        for (var i = 0; i < 10; i++) {
            var spr = new g.FrameSprite({
                scene: scene,
                src: scene.assets["effect"],
                width: 50,
                height: 50,
                frames: [0, 1, 2, 3]
            });
            spr.hide();
            _this.append(spr);
            effects.push(spr);
        }
        //クリア・ミス表示用
        var sprClear = new g.FrameSprite({
            scene: scene,
            src: scene.assets["clear"],
            x: 142,
            y: 120,
            width: 216,
            height: 80,
            frames: [0, 1]
        });
        _this.append(sprClear);
        //前景
        var wakuf = new g.Sprite({
            scene: scene,
            src: scene.assets["wakuf"]
        });
        _this.append(wakuf);
        var setEffect = function (x, y) {
            var effect = effects.filter(function (e) { return (e.state & 1 /* Hidden */); })[0];
            effect.moveTo(x, y);
            effect.frameNumber = 0;
            effect.modified();
            effect.show();
            var tween = timeline.create();
            var _loop_1 = function (i) {
                tween.call(function () {
                    effect.frameNumber = i;
                    effect.modified();
                }).wait(30);
            };
            for (var i = 0; i < 4; i++) {
                _loop_1(i);
            }
            tween.call(function () { effect.hide(); });
        };
        var moveX = 1;
        var speed = 1;
        var frameCnt = 0;
        var enemyCnt = enemys.length;
        var isStop = false;
        var stage = 0;
        _this.update.add(function () {
            if (isStop || !scene.isStart)
                return;
            frameCnt++;
            //自弾の移動
            for (var i = 0; i < shots.length; i++) {
                var shot = shots[i];
                if (!(shot.state & 1 /* Hidden */)) {
                    shot.y -= 8;
                    shot.modified();
                    if (shot.y < -shot.height) {
                        shot.hide();
                    }
                }
            }
            //UFO
            if (!(ufo.state & 1 /* Hidden */)) {
                //移動
                ufo.x -= 4;
                ufo.modified();
                if (ufo.x < 0 - 60) {
                    ufo.hide();
                }
            }
            else {
                //発生
                if ((frameCnt % 300) === 0) {
                    ufo.show();
                    ufo.x = sizeW;
                    ufo.modified();
                    scene.playSound("se_ufo");
                }
            }
            var isTurn = false;
            var isMiss = false;
            enemys.forEach(function (enemy) {
                if (enemy.state & 1 /* Hidden */)
                    return;
                //敵の移動
                enemy.x += (moveX * speed);
                enemy.modified();
                if (moveX === 1 && enemy.x > sizeW - enemy.width - 9) {
                    isTurn = true;
                }
                if (moveX === -1 && enemy.x < 9) {
                    isTurn = true;
                }
                if (enemy.y + enemy.height > player.y) {
                    isMiss = true;
                }
                enemy.anim(frameCnt);
                //敵と弾の衝突判定
                shots.forEach(function (shot) {
                    if (enemy.state & 1 /* Hidden */)
                        return;
                    if (shot.state & 1 /* Hidden */)
                        return;
                    if (g.Collision.intersectAreas(shot, enemy)) {
                        shot.hide();
                        enemy.hide();
                        enemyCnt--;
                        setEffect(enemy.x - 10, enemy.y - 10);
                        scene.addScore(80);
                        scene.playSound("se_up");
                        if (enemyCnt === 1) {
                            speed = 8;
                        }
                        if (enemyCnt === 0) {
                            sprClear.frameNumber = 0;
                            sprClear.modified();
                            sprClear.show();
                            scene.playSound("se_clear");
                            isStop = true;
                            timeline.create().wait(2000).call(function () {
                                next();
                            });
                        }
                    }
                });
                //敵の弾の発生
                if (scene.random.get(0, enemyCnt * (60 - (enemys.length - enemyCnt))) === 0) {
                    for (var i = 0; i < enemyShots.length; i++) {
                        var shot = enemyShots[i];
                        if (shot.state & 1 /* Hidden */) {
                            shot.show();
                            shot.moveTo(enemy.x + (enemy.width - shot.width) / 2, enemy.y);
                            shot.modified();
                            break;
                        }
                    }
                }
            });
            if (isMiss) {
                isStop = true;
                setEffect(player.x - 5, player.y - 5);
                sprPlayer.frameNumber = 1;
                sprPlayer.modified();
                sprClear.frameNumber = 1;
                sprClear.modified();
                sprClear.show();
                scene.playSound("se_miss");
                timeline.create().wait(2000).call(function () {
                    retry();
                });
            }
            //UFOとの衝突判定
            if (!(ufo.state & 1 /* Hidden */)) {
                shots.forEach(function (shot) {
                    if (shot.state & 1 /* Hidden */)
                        return;
                    if (g.Collision.intersectAreas(shot, ufo)) {
                        setEffect(ufo.x + 7, ufo.y);
                        shot.hide();
                        ufo.hide();
                        scene.addScore(300);
                        scene.playSound("se_zen");
                    }
                });
            }
            if (isTurn) {
                moveX = -moveX;
                enemys.forEach(function (enemy) {
                    enemy.y += 10;
                    enemy.modified();
                });
            }
            enemyShots.forEach(function (shot) {
                if (shot.state & 1 /* Hidden */)
                    return;
                //敵の弾の移動
                shot.y += 8;
                shot.modified();
                if (shot.y > sizeH) {
                    shot.hide();
                }
                //プレイヤーの被弾判定
                if (g.Collision.intersectAreas(shot, player)) {
                    shot.hide();
                    isStop = true;
                    setEffect(player.x - 5, player.y - 5);
                    sprPlayer.frameNumber = 1;
                    sprPlayer.modified();
                    sprClear.frameNumber = 1;
                    sprClear.modified();
                    sprClear.show();
                    scene.playSound("se_miss");
                    timeline.create().wait(2000).call(function () {
                        retry();
                    });
                }
            });
            //壁の当たり判定
            walls.forEach(function (wall) {
                if (wall.state & 1 /* Hidden */)
                    return;
                enemyShots.forEach(function (shot) {
                    if (shot.state & 1 /* Hidden */)
                        return;
                    if (g.Collision.intersectAreas(shot, wall)) {
                        shot.hide();
                        wall.hide();
                        scene.playSound("se_move");
                    }
                });
                shots.forEach(function (shot) {
                    if (shot.state & 1 /* Hidden */)
                        return;
                    if (g.Collision.intersectAreas(shot, wall)) {
                        shot.hide();
                        wall.hide();
                        scene.playSound("se_move");
                    }
                });
            });
        });
        _this.pointDown.add(function (e) {
            if (isStop || !scene.isStart)
                return;
            for (var i = 0; i < shots.length; i++) {
                var shot = shots[i];
                if (shot.state & 1 /* Hidden */) {
                    shot.show();
                    shot.moveTo(player.x + (player.width - shot.width) / 2, player.y);
                    shot.modified();
                    scene.playSound("se_shot");
                    return;
                }
            }
        });
        _this.pointMove.add(function (e) {
            if (isStop || !scene.isStart)
                return;
            player.x = (e.point.x + e.startDelta.x) - player.width / 2;
            player.modified();
        });
        //リトライ
        var retry = function () {
            sprPlayer.frameNumber = 0;
            sprPlayer.modified();
            sprClear.hide();
            var i = 0;
            for (var y = 0; y < 4; y++) {
                for (var x = 0; x < 10; x++) {
                    var e = enemys[i];
                    if (!(e.state & 1 /* Hidden */)) {
                        e.x = x * 40 + 7;
                        e.y = y * 40 + 30;
                        e.modified();
                    }
                    i++;
                }
            }
            shots.forEach(function (shot) {
                shot.hide();
            });
            enemyShots.forEach(function (shot) {
                shot.hide();
            });
            ufo.hide();
            speed = 1 + (stage - 1) * 0.2;
            player.show();
            isStop = false;
            frameCnt = 0;
        };
        var next = function () {
            stage++;
            scene.setStage(stage);
            enemys.forEach(function (enemy) {
                enemy.show();
            });
            walls.forEach(function (wall) {
                wall.show();
            });
            enemyCnt = enemys.length;
            retry();
        };
        //リセット
        _this.reset = function () {
            stage = 0;
            speed = 0.5;
            next();
        };
        return _this;
    }
    return MainGame;
}(g.Pane));
exports.MainGame = MainGame;
//敵クラス
var Enemy = /** @class */ (function (_super) {
    __extends(Enemy, _super);
    function Enemy(scene, num) {
        var _this = _super.call(this, {
            scene: scene,
            width: 30,
            height: 30
            //cssColor: "green"
        }) || this;
        _this.num = 0;
        _this.num = num;
        var sprs = [];
        for (var i = 0; i < 2; i++) {
            var spr = new g.Sprite({
                scene: scene,
                src: scene.assets["enemy"],
                srcX: 40 * i,
                srcY: 40 * num,
                srcWidth: 40,
                srcHeight: 40,
                x: -5,
                y: -5,
                height: 40,
                width: 40
            });
            _this.append(spr);
            sprs.push(spr);
        }
        sprs[1].hide();
        var animNum = 0;
        _this.anim = function (n) {
            if (n % 15 === 0) {
                sprs[animNum].hide();
                animNum = (animNum + 1) % 2;
                sprs[animNum].show();
            }
        };
        return _this;
    }
    return Enemy;
}(g.E));
