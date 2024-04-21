let mod;
let bingoList;
let bingoIndexes;

export default class BingoMod {
  prestart() {
    let gameStats;
    mod = activeMods.find((e) => e.name == "cc-bingo");

    bingoList = require("../" + mod.baseDirectory + "data/bingoList.json");
    if (localStorage.getItem('CC_LastBingoSheet')) bingoIndexes = JSON.parse(localStorage.getItem('CC_LastBingoSheet'));

    // just a cute little button to generate sheet, thanks modman (totally not copypasted from a copypaste)
    sc.TitleScreenButtonGui.inject({
      bingoButton: null,
      init(...args) {
        var _a, _b;
        this.parent(...args);
        this.bingoButton = new sc.ButtonGui( "Change Bingo Sheet", sc.BUTTON_DEFAULT_WIDTH - 8 );
        this.bingoButton.setAlign( ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_BOTTOM );
        this.bingoButton.setPos(-20, 40);
        this.bingoButton.onButtonPress = () => { openBingoGen(); };
        this.bingoButton.hook.transitions = { DEFAULT: { state: {}, time: 0.2, timeFunction: KEY_SPLINES.EASE }, HIDDEN: { state: { offsetY: -80, alpha: 0 }, time: 0.2, timeFunction: KEY_SPLINES.LINEAR, }, };
        this.bingoButton.doStateTransition("HIDDEN", true);
        this.buttonGroup.addFocusGui(this.bingoButton, 3, 4);
        this.addChildGui(this.bingoButton);
      },
      show() {
        this.parent();
        this.bingoButton.doStateTransition("DEFAULT");
      },
      hide(a) {
        this.parent(a);
        this.bingoButton.doStateTransition("HIDDEN", a);
      },
    });

    sc.QuickMenu.inject({
      BingoSheetGui: null,
      init(...args) {
        this.parent(...args);
  
        this.BingoSheetGui = new sc.BingoSheetGui();
        this.BingoSheetGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
        this.BingoSheetGui.setPos(48, 0);

        this.addChildGui(this.BingoSheetGui);
      },
      _enterMenu() {
				this.parent();
        this.BingoSheetGui.show();
			},
			_exitMenu() {
        this.BingoSheetGui.hide();
        this.parent();
			},
    });

    sc.BingoSheetGui = sc.TextGui.extend({
      boardInit: null,
      transitions: {
				HIDDEN: { state: { alpha: 0 }, time: 0.1, timeFunction: KEY_SPLINES.LINEAR, },
				DEFAULT: { state: {}, time: 0.1, timeFunction: KEY_SPLINES.LINEAR },
			},
      init: function () {
        this.parent("", {font: sc.fontsystem.tinyFont});
        // this.updateText();
        sc.Model.addObserver(sc.menu, this);
        sc.Model.addObserver(sc.message, this);
        sc.Model.addObserver(sc.model.player, this);
        sc.Model.addObserver(sc.stats, this);
        this.doStateTransition("HIDDEN", true);
      },
  
      initChildren: function (a, b, i) {
        let sheetBox = new sc.BingoSheetBox(a, b);
        sheetBox.setPos((i%5)*48, (this.hook.size.y * Math.floor(i/5) * 6 + 2) );
        this.addChildGui(sheetBox);
      },
      updateText: function () {
        if (bingoIndexes) {
          for (let i = 0; i < bingoIndexes.length; i++) {
            let item = bingoIndexes[i]
            let oldCompletion = item.completed
            item.completed = trackBingoRequirement(bingoList[item.id].reqType, bingoList[item.id].reqCondition) || false;
            let itemText = `${bingoList[item.id].name}`;
            if (!this.boardInit) { this.initChildren(itemText, false, i); }
            if (oldCompletion != item.completed || this.getChildGuiByIndex(i).gui.text == i) {
              bingoNotif("Bingo board updated"); 
              this.getChildGuiByIndex(i).gui.updateText(itemText, item.completed)
            }
          }
          this.boardInit = true;
        }
      },
      
      show() {
        this.parent();
        this.doStateTransition("DEFAULT");
      },
      hide(a) {
				this.doStateTransition("HIDDEN", a);
			},

      modelChanged(model, msg, data) {
        if (model == sc.menu) {
          if (msg == sc.MENU_EVENT.DROP_COMPLETED || msg == sc.MENU_QUEST_HUB_TABS.FINISHED || msg == sc.MENU_EVENT.EQUIP_CHANGED) {
            // console.log(msg, data)
            this.updateText();
          }
        }
        if (model == sc.model.player) {
          if (msg == sc.PLAYER_MSG.ELEMENT_MODE_CHANGE || msg == sc.PLAYER_MSG.SKILL_CHANGED || msg == sc.PLAYER_MSG.LEVEL_CHANGE)
            this.updateText();
        }
        if (model == sc.stats) {
          if (msg == sc.STATS_CATEGORY) {
            if (sc.STATS_CATEGORY == 3) {
              console.log("test");
            }  
          }
        }
      },
      /*
      sc.MENU_QUEST_HUB_TABS.FINISHED for quests
      sc.MENU_EVENT.DROP_COMPLETED for botanics
      sc.PLAYER_ACTION.GUARD && sc.PLAYER_ACTION.PERFECT_GUARD 
      */
    });

    sc.BINGO_COLORS = ["#555555", "#d71112"]

    sc.BingoSheetBox = ig.GuiElementBase.extend({
			transitions: {
				HIDDEN: { state: { alpha: 0 }, time: 0.1, timeFunction: KEY_SPLINES.LINEAR, },
				DEFAULT: { state: {}, time: 0.1, timeFunction: KEY_SPLINES.LINEAR },
			},
			isActive: true,
      background: null,
      color: null,
      textBox: null,
			init: function (a, b) {
				this.parent();
				// this.setSize(48, 48);
        b ? this.color = sc.BINGO_COLORS[1] : this.color = sc.BINGO_COLORS[0]; 
        this.background = new ig.ColorGui(this.color, this.hook.size.x + 2, 2);
        this.background.hook.localAlpha = 0.5;
        this.background.setPos(-2, -2);
        this.background.setSize(48, 48);
        // this.background.setScale(0.5, 0.5);
        this.addChildGui(this.background);
        
        this.textBox = new sc.TextGui(a, { speed: ig.TextBlock.SPEED.FAST, font: sc.fontsystem.tinyFont, });
        this.textBox.setPos(0, (this.hook.size.y) * 2);
        this.textBox.setMaxWidth(48);
        this.textBox.setSize(16,16);
        // this.textBox.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
        this.addChildGui(this.textBox);
			},
			updateText: function (a,b) {
				this.textBox.setText(a);
        b ? this.color = sc.BINGO_COLORS[1] : this.color = sc.BINGO_COLORS[0];
        this.background.color = this.color;
			},
		});

    ig.module("impact.feature.bingo-window").requires("impact.base.game").defines(function () {
        ig.bingoWindow = ig.GameAddon.extend({
          maskVisible: false,
          mask: null,
          form: null,
					seedInput: null,
          challengeList: null,
          init: function () {
            this.parent("BingoWindow");
          },
          toggleMask: function () {
            this.maskVisible ? this.closeMask() : this.showMask();
          },
          showMask: function () {
            this.maskVisible = true;
            ig.system.setFocusLost();
            if (!this.mask) { this._createMask(); this.mask.show(); } else { this.mask.show(); }
          },
          closeMask: function () {
            this.maskVisible = false;
            ig.system.focusLost = false;
            this.mask.hide();
          },
          _createMask: function () {
            var mainWindow = ig.dom.create("div");
            mainWindow.addClass("langEdit bingoWindow");
            var container = ig.dom.create("div");
            container.addClass("container");
            mainWindow.append(container);

            var header = ig.dom.html('<div class="header"></div>');
            header.append(ig.dom.html("<h2> Generate Bingo Sheet </h2>"));

            var seedInput = (this.seedInput = ig.dom.html(
                '<input type="text" class="seed" placeholder="Custom seed" id="seedvalue"></input>'
            ));
            var genForm = (this.form = ig.dom.create("form"));
            var genButton = ig.dom.html(
              '<button type="button">' + "Generate Sheet" + "</button>"
            );
            var cancelButton = ig.dom.html(
              '<button type="button">' +
                ig.lang.get("sc.gui.lang-edit.cancel") +
                "</button>"
            );
            var challengeList = (this.challengeList = ig.dom.create("div"));
            challengeList.addClass('challengeListBox');
            genForm.append(seedInput);
            genForm.append(genButton);
            genForm.append(cancelButton);
            genForm.append(challengeList);
            ig.dom.bind(cancelButton, "click", this.closeMask.bind(this));
            ig.dom.bind(genButton, "click", this.generateSheet.bind(this) );
            container.append(header);
            container.append(genForm);
            this.mask = mainWindow;
            this.mask.hide();
            document.body.appendChild(this.mask[0]);
          },
          _addBingoList: function (item, seed) {
            let listBox = document.getElementsByClassName('challengeListBox')
            listBox[0].innerHTML = "<div style='display: flex; justify-content: space-between;'>" + "<h3>Challenges:</h3><div>Current seed: " + seed + " </div></div>"
            listBox[0].appendChild(item[0])
          },
					generateSheet: function () {
						let seed;
						seed = document.getElementById('seedvalue').value;
						if (seed == undefined || seed == "") { seed = fixedRandomNumber(); }
						bingoIndexes = [];
						for (let i = 0; i < 25; i++) {
							let randomIndex = getRandomIndexWithSeed(bingoList, seed + i);
							bingoIndexes.push({ id: randomIndex, completed: false, });
						}
						let bingoHTMLList = ig.dom.html( '<ul style="display:grid; grid-template-columns: repeat(5,80px); grid-template-rows: repeat(5,80px); justify-content: center; font-family: ""CrossCode"";"></ul>' );
            bingoHTMLList.addClass('bingoGrid')
						for (let item of bingoIndexes) {
							bingoHTMLList.append(
								ig.dom.html(
									'<li class="bingoelement" style="background-color: cornflowerblue; color: black;  border: 1px solid black; font-size: 12px; text-align:center; border-radius: 10px 0px;"> ' +
										bingoList[item.id].name +
									"</li>"
								)
							);
						}
						if (ig.bingoWindow && ig.bingoWindow.mask) {
							ig.bingoWindow._addBingoList(bingoHTMLList, seed);
						}
            localStorage.setItem('CC_LastBingoSheet', JSON.stringify(bingoIndexes));
					}
        });
        ig.addGameAddon(function () {
          return (ig.bingoWindow = new ig.bingoWindow());
        });
    }); 
    
    function obtainGameStats() {
      let stats = {};
      if (sc.stats.values) {
        if (sc.stats.values.exploration != undefined) { stats["exploration"] = sc.stats.values.exploration;}
        if (sc.stats.values.combat != undefined) { stats["enemies"] = sc.stats.values.combat;}
        if (sc.stats.values.chests != undefined) { stats["chests"] = sc.stats.values.chests;}
      }
      if (sc.model.player) {
        stats["arts"] = [...sc.model.player.skills].filter(
          (e) => e && e.skillType != undefined
        );
        stats["items"] = [...sc.model.player.items]
      }
      if (sc.quests) {
        stats["quests"] = sc.quests.finishedQuests;
      }
      return stats;
    }

    function trackBingoRequirement(type, condition) {
      let filteredArts
      let passCondition = 0;

      gameStats = obtainGameStats()
      switch (type){
        case "botanics":
          if (gameStats && gameStats.exploration) {
            for (let item of condition) {
              Object.keys(gameStats.exploration).includes(item) && (passCondition += 1);
            }
            if (passCondition >= condition.length) { return true; }
          }
          break;

        case "art-obtain":
          filteredArts = [...gameStats.arts].filter((item) => condition.level == item.level).filter((item) => condition.type == item.skillType)
          if (filteredArts.length > 0) { return true; }
          break;

        case "art-deny": // 
          filteredArts = [...gameStats.arts].filter((item) => sc.ELEMENT[condition.element] == item.element).filter((item) => condition.level == item.level)
          if (filteredArts.length > 0) {
              if (condition.type == "ANY" || filteredArts.find((item) => item.skillType == condition.type)) {
                return false;
              }
              return true;
            }
          return true;
          break;

        case "item-obtain":
          if (gameStats.items[condition.id] >= condition.amount) { 
            return true;
          }
          break;

        case "landmark": 
          let currentArea = (condition.area + "-landmarks");
          if ((gameStats.exploration && gameStats.exploration[currentArea] != undefined) && (gameStats.exploration[currentArea] >= condition.amount)) {
            return true;
          };
          break;

        case "area-chests":
          if (gameStats.chests[condition.area] && (gameStats.chests[condition.area] >= condition.amount)) {
            return true;
          };
          break;

        case "room-variable":
          break;

        case "quest-completion":
          console.log(gameStats["quests"])
          if (gameStats["quests"] && gameStats["quests"][condition.quest] && gameStats["quests"][condition.quest].solved) {
            if (gameStats["quests"][condition.quest].length > 1) { 
              console.log("returning")
              return false;
            }
            return gameStats["quests"][condition.quest].solved;
          }
          break;

        case "npc-variable":
          break;

      }
    }

    function bingoNotif(msg) {
      new cc.ig.events.SHOW_AR_MSG({"entity": { "player": true },
          "text": {
            "en_US": msg,
            "de_DE": msg,
            "ja_JP": msg,
            "ko_KR": msg,
            "zh_CN": msg,
            "zh_TW": msg,
            "langUid": 23343
          },
          "time": 1,
          "mode": "LINE_FILL",
          "color": "RED",
          "hideOutsideOfScreen": false}).start();
    }
    
    window.trackBingoRequirement = (a, b) => trackBingoRequirement(a,b);
  }
  
}

function openBingoGen() {
  ig.bingoWindow && ig.bingoWindow.showMask();
  // Open popup to ask for seed, if no seed, generate a random one
  // Insert seed for gen.
}



// utils
export function getRandomIndexWithSeed(value, seed) {
  return Math.floor(fixedRandomInt(seed, 0, value.length));
}

export function fixedRandomNumber(seed) {
  return new Math.seedrandomSeed(seed)();
}

export function fixedRandomInt(seed, min, max) {
  return (fixedRandomNumber(seed) * (max - min) + min) >>> 0;
}



/*
 sc.stats.values.exploration[area-landmarks]
 sc.stats.values.exploration[dropfound-xx] (botanics)
 sc.stats.values.killdd
 sc.stats.values.chests[area]
 sc.stats.getMap("combat", "kill" + e)

 sc.model.player.skills 
skillType: "", level: "", "element": 0-4
*/