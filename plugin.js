let mod;
let bingoList;
let bingoIndexes;

export default class BingoMod {
  prestart() {
    let gameStats;
    mod = activeMods.find((e) => e.name == "cc-bingo");

    // just a cute little button to generate sheet, thanks modman (totally not copypasted from a copypaste)
    sc.TitleScreenButtonGui.inject({
      exitRandomizerButton: null,
      init(...args) {
        var _a, _b;
        this.parent(...args);
        this.exitRandomizerButton = new sc.ButtonGui(
          "Generate Bingo Sheet",
          sc.BUTTON_DEFAULT_WIDTH - 8
        );
        this.exitRandomizerButton.setAlign(
          ig.GUI_ALIGN.X_CENTER,
          ig.GUI_ALIGN.Y_BOTTOM
        );
        this.exitRandomizerButton.setPos(-20, 40);
        this.exitRandomizerButton.onButtonPress = () => {
          openBingoGen();
        };
        this.exitRandomizerButton.hook.transitions = {
          DEFAULT: { state: {}, time: 0.2, timeFunction: KEY_SPLINES.EASE },
          HIDDEN: {
            state: { offsetY: -80, alpha: 0 },
            time: 0.2,
            timeFunction: KEY_SPLINES.LINEAR,
          },
        };
        this.exitRandomizerButton.doStateTransition("HIDDEN", true);
        this.buttonGroup.addFocusGui(this.exitRandomizerButton, 3, 4);
        this.addChildGui(this.exitRandomizerButton);
      },
      show() {
        this.parent();
        this.exitRandomizerButton.doStateTransition("DEFAULT");
      },
      hide(a) {
        this.parent(a);
        this.exitRandomizerButton.doStateTransition("HIDDEN", a);
      },
    });

    // ig.Game.inject({
    //   loadingComplete(...args) {
    //     this.gameStats = obtainGameStats();
    //     return this.parent(...args);
    //   },
    // });

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
            if (!this.mask) {
              this._createMask();
              this.mask.show();
            } else {
              this.mask.show();
            }
          },
          closeMask: function () {
            this.maskVisible = false;
            ig.system.focusLost = false;
            this.mask.hide();
          },
          _createMask: function () {
            var mainWindow = ig.dom.create("div");
            mainWindow.addClass("langEdit");
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
            challengeList.addClass('challengeListBox')
            genForm.append(seedInput);
            genForm.append(genButton);
            genForm.append(cancelButton);
            genForm.append(challengeList);
            ig.dom.bind(cancelButton, "click", this.closeMask.bind(this));
            container.append(header);
            container.append(genForm);
            ig.dom.bind(
              genButton,
              "click",
              this.generateSheet.bind(this)
            );
						console.log(seedInput.value, " seed input")
            this.mask = mainWindow;
            this.mask.hide();
            document.body.appendChild(this.mask[0]);
          },
          _submit: function () {
            var b = {};
            console.log("Test");
          },
          _addBingoList: function (item, seed) {
            console.log("trying to show bingo list", item);

						console.log(this.seedInput.value);
            let listBox = document.getElementsByClassName('challengeListBox')
            listBox[0].innerHTML = "<div style='display: flex; justify-content: space-between;'>" + "<h3>Challenges:</h3><div>Current seed: " + seed + " </div></div>"
            listBox[0].appendChild(item[0])
          },
					generateSheet: function generateSheet() {
						let seed;
						seed = document.getElementById('seedvalue').value;
						if (seed == undefined || seed == "") { seed = fixedRandomNumber(); }
						bingoList = require("../" + mod.baseDirectory + "data/bingoList.json");
						bingoIndexes = [];
						for (let i = 0; i < 25; i++) {
							let randomIndex = getRandomIndexWithSeed(bingoList, seed + i);
							// for (let item of bingoIndexes) {
							// 	while (bingoIndexes.find(randomIndex)) {
							// 		randomIndex = getRandomIndex(bingoList.length)
							// 	}
							// }
							bingoIndexes.push({
								id: randomIndex,
								completed: false,
							});
							// console.log(bingoIndexes)
						}
						console.log(bingoList, bingoIndexes, seed);
						let bingoHTMLList = ig.dom.html(
							'<div style="display:grid; grid-template-columns: repeat(5,80px); grid-template-rows: repeat(5,80px); justify-content: center;"></div>'
						);
						for (let item of bingoIndexes) {
							bingoHTMLList.append(
								ig.dom.html(
									'<div style="background-color: cornflowerblue; color: black;  border: 1px solid black; font-size: 13px; text-align:center;"> ' +
										bingoList[item.id].name +
										"</div>"
								)
							);
						}
						if (ig.bingoWindow && ig.bingoWindow.mask) {
							ig.bingoWindow._addBingoList(bingoHTMLList, seed);
						}
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
      console.log(stats);
      return stats;
    }

    function trackBingoRequirement(type, condition) {
      let filteredArts
      let passCondition = 0;

      gameStats = obtainGameStats()
      switch (type){
        case "botanics":
          // console.log("botanis", gameStats)
          if (gameStats && gameStats.exploration) {
            // console.log("gamestats ok")
            for (let item of condition) {
              Object.keys(gameStats.exploration).includes(item) && (passCondition += 1);
              // console.log(condition, passCondition)
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
          console.log(filteredArts);
          if (filteredArts.length > 0) {
            console.log(filteredArts.find((item) => item.skillType == condition.type));
              if (condition.type == "ANY" || filteredArts.find((item) => item.skillType == condition.type)) {
                console.log("MATCH FOUND")
                return false;
              }
              return true;
            }
          return true;
          break;
        case "item-obtain":
          if (gameStats.chests[condition.id] > 0) { 
            console.log("player has that item")
            return true;
          }
          break;
        case "landmark": 
        // sc.stats.values.exploration[area-landmarks]
          let currentArea = (condition.area + "-landmarks");
          console.log((gameStats.exploration[currentArea]), (gameStats.exploration[currentArea] >= condition.amount))
          if ((gameStats.exploration[currentArea] != undefined) && (gameStats.exploration[currentArea] >= condition.amount)) {
            console.log("landmarks yes", (gameStats.exploration[currentArea] >= condition.amount))
            return true;
          };
          console.log("no :(")
          break;
        case "area-chests":
          console.log(condition, gameStats.chests[condition.area])
          if (gameStats.chests[condition.area] && (gameStats.chests[condition.area] >= condition.amount)) {
            console.log("chests yes")
            return true;
          };
          break;
        case "room-variable":
          break;
        case "quest-completion":
          break;
        case "npc-variable":
          break;
      }
    }

    // these debug mfs
    window.trackBingoRequirement = (a, b) => trackBingoRequirement(a,b);
  }
  
}

function openBingoGen() {
  // console.log("Yes");
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

 sc.model.player.skills 
skillType: "", level: "", "element": 0-4
*/