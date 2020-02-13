import { Config } from "./Config";
import { Button } from "./Button";
declare function require(x: string): any;
/* tslint:disable: align */
export class MainScene extends g.Scene {
	public lastJoinedPlayerId: string; // 配信者のID
	private font: g.Font;

	constructor(param: g.SceneParameterObject) {
		param.assetIds = [
			"img_numbers_n", "img_numbers_n_red", "title", "start", "finish", "score", "time", "state", "state2",
			"config", "volume", "test", "glyph72", "number_w", "number_b",
			"se_start", "se_timeup", "bgm", "se_clear", "se_correct", "se_miss", "se_finish","se_type"];
		super(param);

		const tl = require("@akashic-extension/akashic-timeline");
		const timeline = new tl.Timeline(this);
		const timeline2 = new tl.Timeline(this);
		const isDebug = false;

		this.loaded.add(() => {

			g.game.vars.gameState = { score: 0 };

			// 何も送られてこない時は、標準の乱数生成器を使う
			let random = g.game.random;
			let isStart = false;

			this.message.add((msg) => {
				if (msg.data && msg.data.type === "start" && msg.data.parameters) { // セッションパラメータのイベント
					const sessionParameters = msg.data.parameters;
					if (sessionParameters.randomSeed != null) {
						// プレイヤー間で共通の乱数生成器を生成
						// `g.XorshiftRandomGenerator` は Akashic Engine の提供する乱数生成器実装で、 `g.game.random` と同じ型。
						random = new g.XorshiftRandomGenerator(sessionParameters.randomSeed);
					}
				}
			});

			// 配信者のIDを取得
			this.lastJoinedPlayerId = "";
			g.game.join.add((ev) => {
				this.lastJoinedPlayerId = ev.player.id;
			});

			// 背景
			const bg = new g.FilledRect({ scene: this, width: 640, height: 360, cssColor: "gray", opacity: 0 });
			this.append(bg);
			if ((typeof window !== "undefined" && window.RPGAtsumaru) || isDebug) {
				bg.opacity = 1.0;
				bg.modified();
			}
			bg.hide();

			const bg2 = new g.FilledRect({ scene: this, width: 640, height: 360, cssColor: "gray", opacity: 0.5 });
			this.append(bg2);

			const base = new g.E({ scene: this });
			this.append(base);
			base.hide();

			const uiBase = new g.E({ scene: this });
			this.append(uiBase);
			uiBase.hide();

			//タイトル
			const sprTitle = new g.Sprite({ scene: this, src: this.assets["title"], x: 70 });
			this.append(sprTitle);
			timeline.create(
				sprTitle, {
					modified: sprTitle.modified, destroyd: sprTitle.destroyed
				}).wait(5000).moveBy(-800, 0, 200).call(() => {
					bg.show();
					base.show();
					uiBase.show();
					isStart = true;
					reset();
				});

			let glyph = JSON.parse((this.assets["test"] as g.TextAsset).data);
			const numFont = new g.BitmapFont({
				src: this.assets["img_numbers_n"],
				map: glyph.map,
				defaultGlyphWidth: glyph.width,
				defaultGlyphHeight: glyph.height,
				missingGlyph: glyph.missingGlyph
			});

			const numFontRed = new g.BitmapFont({
				src: this.assets["img_numbers_n_red"],
				map: glyph.map,
				defaultGlyphWidth: glyph.width,
				defaultGlyphHeight: glyph.height,
				missingGlyph: glyph.missingGlyph
			});

			glyph = JSON.parse((this.assets["glyph72"] as g.TextAsset).data);
			const numFontW = new g.BitmapFont({
				src: this.assets["number_w"],
				map: glyph.map,
				defaultGlyphWidth: 65,
				defaultGlyphHeight: 80
			});

			glyph = JSON.parse((this.assets["glyph72"] as g.TextAsset).data);
			const numFontB = new g.BitmapFont({
				src: this.assets["number_b"],
				map: glyph.map,
				defaultGlyphWidth: 72,
				defaultGlyphHeight: 80
			});

			//問題数
			uiBase.append(new g.Sprite({ scene: this, src: this.assets["score"], x: 90, y: 5, height: 32, srcY: 32 }));
			const labelStage = new g.Label({
				scene: this,
				x: 0,
				y: 5,
				width: 90,
				fontSize: 32,
				font: numFont,
				text: "1",
				textAlign: g.TextAlign.Right, widthAutoAdjust: false
			});
			uiBase.append(labelStage);

			//スコア
			uiBase.append(new g.Sprite({ scene: this, src: this.assets["score"], x: 370, y: 5, height: 32 }));
			let score = 0;
			const labelScore = new g.Label({
				scene: this,
				x: 282,
				y: 5,
				width: 32 * 10,
				fontSize: 32,
				font: numFont,
				text: "0P",
				textAlign: g.TextAlign.Right, widthAutoAdjust: false
			});
			uiBase.append(labelScore);

			//正解数
			let cntCorrect = 0;
			uiBase.append(new g.Sprite({ scene: this, src: this.assets["state2"], x: 150, y: 5, width: 32, height: 32 }));
			const labelCorrect = new g.Label({
				scene: this,
				x: 170,
				y: 5,
				width: 32 * 2,
				fontSize: 32,
				font: numFont,
				text: "10",
				textAlign: g.TextAlign.Right, widthAutoAdjust: false
			});
			uiBase.append(labelCorrect);

			//不正解数
			let cntMiss = 0;
			uiBase.append(new g.Sprite({ scene: this, src: this.assets["state2"], x: 250, y: 5, srcX: 32, width: 32, height: 32 }));
			const labelMiss = new g.Label({
				scene: this,
				x: 270,
				y: 5,
				width: 32 * 2,
				fontSize: 32,
				font: numFont,
				text: "10",
				textAlign: g.TextAlign.Right, widthAutoAdjust: false
			});
			uiBase.append(labelMiss);

			//タイム
			uiBase.append(new g.Sprite({ scene: this, src: this.assets["time"], x: 540, y: 320 }));
			const labelTime = new g.Label({ scene: this, font: numFont, fontSize: 32, text: "70", x: 580, y: 323 });
			uiBase.append(labelTime);

			//開始
			const sprStart = new g.Sprite({ scene: this, src: this.assets["start"], x: 50, y: 100 });
			uiBase.append(sprStart);
			sprStart.hide();

			//終了
			const finishBase = new g.E({ scene: this, x: 0, y: 0 });
			this.append(finishBase);
			finishBase.hide();

			const finishBg = new g.FilledRect({ scene: this, width: 640, height: 360, cssColor: "#000000", opacity: 0.3 });
			finishBase.append(finishBg);

			const sprFinish = new g.Sprite({ scene: this, src: this.assets["finish"], x: 120, y: 100 });
			finishBase.append(sprFinish);

			//最前面
			const fg = new g.FilledRect({ scene: this, width: 640, height: 360, cssColor: "#ff0000", opacity: 0.0 });
			this.append(fg);

			//リセットボタン
			const btnReset = new Button(this, ["リセット"], 500, 270, 130);
			if ((typeof window !== "undefined" && window.RPGAtsumaru) || isDebug) {
				finishBase.append(btnReset);
				btnReset.pushEvent = () => {
					reset();
				};
			}

			//ランキングボタン
			const btnRanking = new Button(this, ["ランキング"], 500, 200, 130);
			if ((typeof window !== "undefined" && window.RPGAtsumaru) || isDebug) {
				finishBase.append(btnRanking);
				btnRanking.pushEvent = () => {
					window.RPGAtsumaru.experimental.scoreboards.display(1);
				};
			}

			//設定ボタン
			const btnConfig = new g.Sprite({ scene: this, x: 600, y: 0, src: this.assets["config"], touchable: true });
			if ((typeof window !== "undefined" && window.RPGAtsumaru) || isDebug) {
				this.append(btnConfig);
			}

			//設定画面
			const config = new Config(this, 380, 40);
			if ((typeof window !== "undefined" && window.RPGAtsumaru) || isDebug) {
				this.append(config);
			}
			config.hide();

			btnConfig.pointDown.add(() => {
				if (config.state & 1) {
					config.show();
				} else {
					config.hide();
				}
			});

			config.bgmEvent = (num) => {
				bgm.changeVolume(0.5 * num);
			};

			config.colorEvent = (str) => {
				bg.cssColor = str;
				bg.modified();
			};

			const bgm = (this.assets["bgm"] as g.AudioAsset).play();
			bgm.changeVolume(0.2);

			const paneBase = new g.Pane({ scene: this, x: 10, y: 40, width: 350, height: 310 });
			base.append(paneBase);

			const mapBase = new g.FilledRect({ scene: this, x: 0, y: 0, width: 350, height: 310, cssColor: "black" });
			paneBase.append(mapBase);

			//問題
			const formulas: Formula[] = [];
			for (let i = 0; i < 6; i++) {
				const formula = new Formula(this, numFontW, 0, i * 80);
				mapBase.append(formula);
				formulas.push(formula);
			}

			//解答欄
			const ansArea: g.Label = new g.Label({
				scene: this, font: numFontW, fontSize: 60, text: "__", x: 250, y: 83
			});
			mapBase.append(ansArea);
			timeline.create(ansArea, { loop: true })
				.wait(500).call(() => {
					ansArea.opacity = 0;
					ansArea.modified();
				})
				.wait(500).call(() => {
					ansArea.opacity = 1;
					ansArea.modified();
				});

			//マスク
			const maskTop = new g.FilledRect({ scene: this, x: 0, y: 0, width: 350, height: 80, cssColor: "black", opacity: 0.3 });
			paneBase.append(maskTop);

			const maskBottom = new g.FilledRect({ scene: this, x: 0, y: 160, width: 350, height: 150, cssColor: "black", opacity: 0.3 });
			paneBase.append(maskBottom);

			//ライン
			const line = new g.FilledRect({ scene: this, x: 5, y: 150, width: 340, height: 2, cssColor: "white" });
			paneBase.append(line);

			//ボタン
			let formuraCnt = 0;
			const btnBase = new g.E({ scene: this, x: 380, y: 40 });
			const btns: NumButton[] = [];
			for (let y = 0; y < 3; y++) {
				for (let x = 0; x < 3; x++) {
					btns.push(new NumButton({
						scene: this, x: x * 80, y: y * 80, width: 80 - 2, height: 80 - 2, cssColor: "white"
					}, numFontB, 9 - (y * 3 + (2 - x))));
					btnBase.append(btns[btns.length - 1]);
				}
			}
			const btn = new NumButton(
				{ scene: this, x: 0, y: 3 * 80, width: 80 * 2 - 2, height: 70 - 2, cssColor: "white" },
				numFontB, 0
			);
			btnBase.append(btn);
			btns.push(btn);

			base.append(btnBase);

			let isStop = false;
			const bkTween: any[] = [];
			btns.forEach(b => {
				b.pointDown.add(() => {
					if (isStop || !isStart) return;

					b.cssColor = "gray";
					b.modified();
					const f = formulas[Math.floor((1 + formuraCnt) % formulas.length)];
					f.input(b.num);
					const state = f.calc();
					if (state === 0 || state === 1) {
						const wait = (state === 0) ? 500 : 1000;
						if (state !== 0) {
							isStop = true;
						}
						for (let i = 0; i < formulas.length; i++) {
							const j = Math.floor((i + formuraCnt) % formulas.length);
							const e = formulas[j];
							e.y = i * 80;
							e.modified();
							timeline.remove(bkTween[i]);

							bkTween[i] = timeline.create(e, { modified: e.modified, destroyed: e.destroyed })
								.wait(wait)
								.call(() => {
									ansArea.hide();
								})
								.moveTo(0, (i - 1) * 80, 200);

							const num = formuraCnt;
							timeline.create().wait(wait + 200).call(() => {
								if (i === 0) e.hide();
								if (i === formulas.length - 1) {
									const a = list[(num + formulas.length) % 100];
									e.reset(a.left, a.right, a.op);
									e.show();
								}
								ansArea.show();
								if (state !== 0) {
									isStop = false;
								}
							});
						}

						if (state === 0) {
							addScore(100 + ((f.labelAns.text.length - 1) * 20));
							cntCorrect++;
							labelCorrect.text = "" + cntCorrect;
							labelCorrect.invalidate();
							(this.assets["se_correct"] as g.AudioAsset).play().changeVolume(config.volumes[1]);
						} else {
							cntMiss++;
							labelMiss.text = "" + cntMiss;
							labelMiss.invalidate();
							(this.assets["se_miss"] as g.AudioAsset).play().changeVolume(config.volumes[1]);
						}
						formuraCnt++;
						labelStage.text = "" + (formuraCnt + 1);
						labelStage.invalidate();
					}
					(this.assets["se_type"] as g.AudioAsset).play().changeVolume(config.volumes[1]);
				});
				b.pointUp.add(() => {
					b.cssColor = "white";
					b.modified();
				});
			});

			//押したとき
			mapBase.pointDown.add((ev) => {
				if (!isStart) return;
			});

			//動かしたとき
			mapBase.pointMove.add((ev) => {
				if (!isStart) return;
			});

			mapBase.pointUp.add((ev) => {
				if (!isStart) return;
			});

			//メインループ
			let bkTime = 0;
			const timeLimit = 70;
			let startTime: number = 0;
			this.update.add(() => {
				//return;//デバッグ用

				if (!isStart) return;
				const t = timeLimit - Math.floor((Date.now() - startTime) / 1000);

				//終了処理
				if (t <= -1) {
					fg.cssColor = "#000000";
					fg.opacity = 0.0;
					fg.modified();

					finishBase.show();

					isStart = false;

					(this.assets["se_timeup"] as g.AudioAsset).play().changeVolume(config.volumes[1]);

					timeline.create().wait(1500).call(() => {
						if (typeof window !== "undefined" && window.RPGAtsumaru) {
							window.RPGAtsumaru.experimental.scoreboards.setRecord(1, g.game.vars.gameState.score).then(() => {
								btnRanking.show();
								btnReset.show();
							});
						}

						if (isDebug) {
							btnRanking.show();
							btnReset.show();
						}
					});

					return;
				}

				labelTime.text = "" + t;
				labelTime.invalidate();

				if (bkTime !== t && t <= 5) {
					fg.opacity = 0.1;
					fg.modified();
					timeline.create().wait(500).call(() => {
						fg.opacity = 0.0;
						fg.modified();
					});
				}

				bkTime = t;
			});

			//スコア加算表示
			const addScore = (num: number) => {

				if (score + num < 0) {
					num = -score;
				}
				score += num;

				timeline.create().every((e: number, p: number) => {
					labelScore.text = "" + (score - Math.floor(num * (1 - p))) + "P";
					labelScore.invalidate();
				}, 500);

				g.game.vars.gameState.score = score;
			};

			const list: Array<{ left: number, right: number, op: number }> = [];

			//リセット
			const reset = () => {
				bkTime = 0;
				startTime = Date.now();
				isStart = true;

				score = 0;
				labelScore.text = "0P";
				labelScore.invalidate();

				sprStart.show();
				timeline.create().wait(750).call(() => {
					sprStart.hide();
				});

				btnReset.hide();
				btnRanking.hide();
				fg.opacity = 0;
				fg.modified();

				formuraCnt = 0;
				labelStage.text = "1";
				labelStage.invalidate();

				list.length = 0;
				for (let i = 0; i < 100; i++) {
					let op = random.get(0, 3);

					if (i !== 0) {
						while(op === list[i - 1].op) {
							op = random.get(0, 3);
						}
					}

					if (op === 3) {
						while (true) {
							const left = random.get(1, 9);
							const right = random.get(1, 9);
							if ((left % right) === 0) {
								list.push({ left: left, right: right, op: op });
								break;
							}
						}
					} else if (op === 1) {
						let left = random.get(0, 9);
						let right = random.get(0, 9);
						if (left < right) {
							[left, right] = [right, left];
						}
						list.push({ left: left, right: right, op: op });
					} else {
						const left = random.get(0, 9);
						const right = random.get(0, 9);
						list.push({ left: left, right: right, op: op });
					}
				}

				for (let i = 0; i < formulas.length; i++) {
					const e = list[i];
					formulas[i].y = i * 80;
					formulas[i].reset(e.left, e.right, e.op);
					formulas[i].show();
				}
				formulas[0].hide();

				cntCorrect = 0;
				labelCorrect.text = "0";
				labelCorrect.invalidate();

				cntMiss = 0;
				labelMiss.text = "0";
				labelMiss.invalidate();

				finishBase.hide();

				startTime = Date.now();

				(this.assets["se_start"] as g.AudioAsset).play().changeVolume(config.volumes[1]);

			};
		});
	}
}

//計算式表示と計算処理
class Formula extends g.E {
	public left: number = 0;
	public right: number = 0;
	public op: number = 0;
	public labelAns: g.Label;
	private opStr: string[] = ["+", "-", "*", "/"];
	private label: g.Label;
	private sprState: g.FrameSprite;
	private ans: number = 0;
	constructor(scene: g.Scene, font: g.Font, x: number, y: number) {
		super({ scene: scene, x: x, y: y });
		this.label = new g.Label({ scene: scene, font: font, fontSize: 60, text: "", x: 55, y: 5 });
		this.append(this.label);

		this.labelAns = new g.Label({ scene: scene, font: font, fontSize: 60, text: "", x: 250, y: 5 });
		this.append(this.labelAns);

		this.sprState = new g.FrameSprite({
			scene: scene,
			src: scene.assets["state"] as g.ImageAsset,
			width: 60,
			height: 60,
			y: 5,
			frames: [0, 1]
		});
		this.append(this.sprState);
	}

	public reset(left: number, right: number, op: number) {
		this.left = left;
		this.right = right;
		this.op = op;
		this.label.text = "" + left + this.opStr[op] + right + "=";
		this.label.invalidate();
		this.sprState.hide();

		if (op === 0) {
			this.ans = left + right;
		} else if (op === 1) {
			this.ans = left - right;
		} else if (op === 2) {
			this.ans = left * right;
		} else if (op === 3) {
			this.ans = left / right;
		}

		this.labelAns.text = "";
		this.labelAns.invalidate();
	}

	public input(i: number) {
		this.labelAns.text += "" + i;
		this.labelAns.invalidate();
	}

	//計算結果を返す(0: 正解, 1:不正解, 2:途中)
	public calc(): number {
		let returnNum = 0;
		const ans = parseInt(this.labelAns.text, 10);
		if (Math.floor(this.ans / 10) !== 0 && Math.floor(ans / 10) === 0) {
			if (Math.floor(this.ans / 10) === ans) {
				returnNum = 2;
			} else {
				returnNum = 1;
			}
		} else {
			if (this.ans === ans) {
				returnNum = 0;
			} else {
				returnNum = 1;
			}
		}

		this.sprState.frameNumber = returnNum;
		this.sprState.modified();
		this.sprState.show();

		return returnNum;
	}
}

//数字ボタン
class NumButton extends g.FilledRect {
	public num: number = 0;
	constructor(param: g.FilledRectParameterObject, font: g.Font, num: number) {
		super(param);
		this.touchable = true;
		this.num = num;
		this.append(new g.Label({
			scene: param.scene, font: font, fontSize: 60, text: "" + num, x: 0, y: 10, width: this.width,
			widthAutoAdjust: false, textAlign: g.TextAlign.Center
		}));
	}
}
