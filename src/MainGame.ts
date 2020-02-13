import { MainScene } from "./MainScene";
declare function require(x: string): any;
//メインのゲーム画面
export class MainGame extends g.Pane {
	public reset: () => void;

	constructor(scene: MainScene) {
		const tl = require("@akashic-extension/akashic-timeline");
		const timeline = new tl.Timeline(scene);
		const sizeW = 500;
		const sizeH = 360;

		super({ scene: scene, x: 0, y: 0, width: sizeW, height: sizeH, touchable: true });

		const waku = new g.Sprite({
			scene: scene,
			src: scene.assets["waku"]
		});
		this.append(waku);

		//プレイヤー
		const player = new g.E({
			scene: scene,
			x: 230,
			y: 320,
			width: 30,
			height: 30
		});
		this.append(player);

		const sprPlayer = new g.FrameSprite({
			scene: scene,
			src: scene.assets["player"] as g.ImageAsset,
			x: -5,
			y: -5,
			width: 40,
			height: 40,
			frames: [0, 1]
		});

		player.append(sprPlayer);

		//敵
		const enemys: Enemy[] = [];
		for (let y = 0; y < 4; y++) {
			for (let x = 0; x < 10; x++) {
				const enemy = new Enemy(scene, y);
				this.append(enemy);
				enemys.push(enemy);
			}
		}

		//UFO
		const ufo = new g.FrameSprite({
			scene: scene,
			x: 0,
			y: 3,
			width: 75,
			height: 45,
			src: scene.assets["ufo"] as g.ImageAsset,
			frames: [0, 1],
			interval: 500
		});
		ufo.hide();
		ufo.start();
		this.append(ufo);

		//壁
		const walls: g.Sprite[] = [];
		for (let i = 0; i < 3; i++) {
			for (let y = 0; y < 2; y++) {
				for (let x = 0; x < 3; x++) {
					const wall = new g.Sprite({
						scene: scene,
						x: (x * 30) + (i * 150) + 60,
						y: (y * 15) + 280,
						src: scene.assets["wall"]
					});
					this.append(wall);
					walls.push(wall);
				}
			}
		}

		//プレイヤーの弾
		const shots: g.Sprite[] = [];
		for (let i = 0; i < 3; i++) {
			const shot = new g.Sprite({
				scene: scene,
				src: scene.assets["shot"]
			});
			shot.hide();
			this.append(shot);
			shots.push(shot);
		}

		//敵の弾
		const enemyShots: g.Sprite[] = [];
		for (let i = 0; i < 10; i++) {
			const shot = new g.Sprite({
				scene: scene,
				src: scene.assets["eshot"]
			});
			shot.hide();
			this.append(shot);
			enemyShots.push(shot);
		}

		//爆発エフェクト用
		const effects: g.FrameSprite[] = [];
		for (let i = 0; i < 10; i++) {
			const spr = new g.FrameSprite({
				scene: scene,
				src: scene.assets["effect"] as g.ImageAsset,
				width: 50,
				height: 50,
				frames: [0, 1, 2, 3]
			});
			spr.hide();
			this.append(spr);
			effects.push(spr);
		}

		//クリア・ミス表示用
		const sprClear = new g.FrameSprite({
			scene: scene,
			src: scene.assets["clear"] as g.ImageAsset,
			x: 142,
			y:120,
			width: 216,
			height: 80,
			frames: [0,1]
		});
		this.append(sprClear);

		//前景
		const wakuf = new g.Sprite({
			scene: scene,
			src: scene.assets["wakuf"]
		});
		this.append(wakuf);

		const setEffect = (x: number, y: number) => {
			const effect = effects.filter(e => (e.state & g.EntityStateFlags.Hidden))[0];
			effect.moveTo(x, y);
			effect.frameNumber = 0;
			effect.modified();
			effect.show();
			const tween = timeline.create();
			for (let i = 0; i < 4; i++) {
				tween.call(() => {
					effect.frameNumber = i;
					effect.modified();
				}).wait(30);
			}
			tween.call(() => { effect.hide(); });

		};

		let moveX = 1;
		let speed = 1;
		let frameCnt = 0;
		let enemyCnt = enemys.length;
		let isStop = false;
		let stage = 0;
		this.update.add(() => {
			if (isStop || !scene.isStart) return;

			frameCnt++;

			//自弾の移動
			for (let i = 0; i < shots.length; i++) {
				const shot = shots[i];
				if (!(shot.state & g.EntityStateFlags.Hidden)) {
					shot.y -= 8;
					shot.modified();
					if (shot.y < -shot.height) {
						shot.hide();
					}
				}
			}

			//UFO
			if (!(ufo.state & g.EntityStateFlags.Hidden)) {
				//移動
				ufo.x -= 4;
				ufo.modified();
				if (ufo.x < 0 - 60) {
					ufo.hide();
				}
			} else {
				//発生
				if ((frameCnt % 300) === 0) {
					ufo.show();
					ufo.x = sizeW;
					ufo.modified();
					scene.playSound("se_ufo");
				}
			}

			let isTurn = false;
			let isMiss = false;
			enemys.forEach((enemy) => {
				if (enemy.state & g.EntityStateFlags.Hidden) return;

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
				shots.forEach((shot) => {
					if (enemy.state & g.EntityStateFlags.Hidden) return;
					if (shot.state & g.EntityStateFlags.Hidden) return;
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
							timeline.create().wait(2000).call(() => {
								next();
							});
						}
					}
				});

				//敵の弾の発生
				if (scene.random.get(0, enemyCnt * (60 - (enemys.length - enemyCnt))) === 0) {
					for (let i = 0; i < enemyShots.length; i++) {
						const shot = enemyShots[i];
						if (shot.state & g.EntityStateFlags.Hidden) {
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

				timeline.create().wait(2000).call(() => {
					retry();
				});
			}

			//UFOとの衝突判定
			if (!(ufo.state & g.EntityStateFlags.Hidden)) {
				shots.forEach((shot) => {
					if (shot.state & g.EntityStateFlags.Hidden) return;
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

				enemys.forEach((enemy) => {
					enemy.y += 10;
					enemy.modified();
				});
			}

			enemyShots.forEach((shot) => {
				if (shot.state & g.EntityStateFlags.Hidden) return;

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

					timeline.create().wait(2000).call(() => {
						retry();
					});
				}

			});

			//壁の当たり判定
			walls.forEach((wall) => {
				if (wall.state & g.EntityStateFlags.Hidden) return;

				enemyShots.forEach((shot) => {
					if (shot.state & g.EntityStateFlags.Hidden) return;
					if (g.Collision.intersectAreas(shot, wall)) {
						shot.hide();
						wall.hide();
						scene.playSound("se_move");
					}
				});

				shots.forEach((shot) => {
					if (shot.state & g.EntityStateFlags.Hidden) return;
					if (g.Collision.intersectAreas(shot, wall)) {
						shot.hide();
						wall.hide();
						scene.playSound("se_move");
					}
				});
			});

		});

		this.pointDown.add((e) => {
			if (isStop || !scene.isStart) return;
			for (let i = 0; i < shots.length; i++) {
				const shot = shots[i];
				if (shot.state & g.EntityStateFlags.Hidden) {
					shot.show();
					shot.moveTo(player.x + (player.width - shot.width) / 2, player.y);
					shot.modified();
					scene.playSound("se_shot");
					return;
				}
			}
		});

		this.pointMove.add((e) => {
			if (isStop || !scene.isStart) return;
			player.x = (e.point.x + e.startDelta.x) - player.width / 2;
			player.modified();
		});

		//リトライ
		const retry = () => {

			sprPlayer.frameNumber = 0;
			sprPlayer.modified();

			sprClear.hide();

			let i = 0;
			for (let y = 0; y < 4; y++) {
				for (let x = 0; x < 10; x++) {
					const e = enemys[i];
					if (!(e.state & g.EntityStateFlags.Hidden)) {
						e.x = x * 40 + 7;
						e.y = y * 40 + 30;
						e.modified();
					}
					i++;
				}
			}

			shots.forEach(shot => {
				shot.hide();
			});

			enemyShots.forEach(shot => {
				shot.hide();
			});

			ufo.hide();

			speed = 1 + (stage - 1) * 0.2;
			player.show();
			isStop = false;
			frameCnt = 0;
		};

		const next = () => {
			stage++;
			scene.setStage(stage);

			enemys.forEach(enemy => {
				enemy.show();
			});

			walls.forEach(wall => {
				wall.show();
			});

			enemyCnt = enemys.length;
			retry();
		};

		//リセット
		this.reset = () => {
			stage = 0;
			speed = 0.5;
			next();
		};
	}
}

//敵クラス
class Enemy extends g.E {
	public anim: (n: number) => void;
	private num: number = 0;
	constructor(scene: g.Scene, num: number) {
		super({
			scene: scene,
			width: 30,
			height: 30
			//cssColor: "green"
		});
		this.num = num;

		const sprs: g.Sprite[] = [];
		for (let i = 0; i < 2; i++) {
			const spr = new g.Sprite({
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
			this.append(spr);
			sprs.push(spr);
		}
		sprs[1].hide();

		let animNum = 0;
		this.anim = (n: number) => {
			if (n % 15 === 0) {
				sprs[animNum].hide();
				animNum = (animNum + 1) % 2;
				sprs[animNum].show();
			}
		};

	}
}
