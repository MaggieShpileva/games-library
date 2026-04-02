// @ts-nocheck

import { Game } from './pacmanEngine';
import { PACMAN_LEVELS, type PacmanLevelConfig } from './pacmanLevels';

const NPC_COLORS = ['#F00', '#F93', '#0CF', '#F9C'];
const COS = [1, 0, -1, 0];
const SIN = [0, 1, 0, -1];

export function initPacman(canvas: HTMLCanvasElement): () => void {
  let life = 5;
  let score = 0;
  const game = new Game(canvas);

  var stage = game.createStage();
  //logo
  stage.createItem({
    x: game.width / 2,
    y: game.height * 0.35,
    width: 100,
    height: 100,
    frames: 3,
    draw: function (context) {
      var t = Math.abs(5 - (this.times % 10));
      context.fillStyle = '#FFE600';
      context.beginPath();
      context.arc(
        this.x,
        this.y,
        this.width / 2,
        t * 0.04 * Math.PI,
        (2 - t * 0.04) * Math.PI,
        false
      );
      context.lineTo(this.x, this.y);
      context.closePath();
      context.fill();
      context.fillStyle = '#000';
      context.beginPath();
      context.arc(this.x + 5, this.y - 27, 7, 0, 2 * Math.PI, false);
      context.closePath();
      context.fill();
    },
  });
  // game name
  stage.createItem({
    x: game.width / 2,
    y: game.height * 0.5,
    draw: function (context) {
      context.font = 'bold 42px PressStart2P';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillStyle = '#FFF';
      context.fillText('Pac-Man', this.x, this.y);
    },
  });
  // hint
  stage.createItem({
    x: game.width / 2,
    y: game.height * 0.64,
    frames: 28,
    draw: function (context) {
      if (this.times % 2) {
        context.font = 'bold 14px PressStart2P';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = '#AAA';
        context.fillText('Press Enter to start', this.x, this.y);
      }
    },
  });
  // original author (MIT)
  stage
    .createItem({
      x: game.width - 10,
      y: game.height - 5,
      draw: function (context) {
        var text = 'mumuy/pacman · MIT';
        context.font = '12px/20px PressStart2P';
        context.textAlign = 'left';
        context.textBaseline = 'top';
        context.fillStyle = '#AAA';
        this.width = context.measureText(text).width;
        this.x = game.width - this.width - 10;
        this.y = game.height - 20 - 5;
        context.fillText(text, this.x, this.y);
      },
    })
    .bind('click', function () {
      window.open(
        'https://github.com/mumuy/pacman',
        '_blank',
        'noopener,noreferrer'
      );
    });
  // event binding
  stage.bind('keydown', function (e) {
    switch (e.keyCode) {
      case 13:
      case 32:
        game.nextStage();
        break;
    }
  });

  PACMAN_LEVELS.forEach(function (config: PacmanLevelConfig, index: number) {
    var stage, map, beans, items, player;
    stage = game.createStage({
      update: function () {
        var stage = this;
        if (stage.status == 1) {
          // scene is running normally
          items.forEach(function (item) {
            if (
              map &&
              !map.get(item.coord.x, item.coord.y) &&
              !map.get(player.coord.x, player.coord.y)
            ) {
              var dx = item.x - player.x;
              var dy = item.y - player.y;
              if (dx * dx + dy * dy < 750 && item.status != 4) {
                // object detection
                if (item.status == 3) {
                  item.status = 4;
                  score += 10;
                } else {
                  stage.status = 3;
                  stage.timeout = 30;
                }
              }
            }
          });
          if (JSON.stringify(beans.data).indexOf(0) < 0) {
            // when there are no items, go to the next level
            game.nextStage();
          }
        } else if (stage.status == 3) {
          // temporary scene status
          if (!stage.timeout) {
            life--;
            if (life) {
              stage.resetItems();
            } else {
              var stages = game.getStages();
              game.setStage(stages.length - 1);
              return false;
            }
          }
        }
      },
    });
    // draw map
    map = stage.createMap({
      x: 60,
      y: 10,
      data: config.map,
      cache: true,
      draw: function (context) {
        context.lineWidth = 2;
        for (var j = 0; j < this.y_length; j++) {
          for (var i = 0; i < this.x_length; i++) {
            var value = this.get(i, j);
            if (value) {
              var code = [0, 0, 0, 0];
              if (
                this.get(i + 1, j) &&
                !(
                  this.get(i + 1, j - 1) &&
                  this.get(i + 1, j + 1) &&
                  this.get(i, j - 1) &&
                  this.get(i, j + 1)
                )
              ) {
                code[0] = 1;
              }
              if (
                this.get(i, j + 1) &&
                !(
                  this.get(i - 1, j + 1) &&
                  this.get(i + 1, j + 1) &&
                  this.get(i - 1, j) &&
                  this.get(i + 1, j)
                )
              ) {
                code[1] = 1;
              }
              if (
                this.get(i - 1, j) &&
                !(
                  this.get(i - 1, j - 1) &&
                  this.get(i - 1, j + 1) &&
                  this.get(i, j - 1) &&
                  this.get(i, j + 1)
                )
              ) {
                code[2] = 1;
              }
              if (
                this.get(i, j - 1) &&
                !(
                  this.get(i - 1, j - 1) &&
                  this.get(i + 1, j - 1) &&
                  this.get(i - 1, j) &&
                  this.get(i + 1, j)
                )
              ) {
                code[3] = 1;
              }
              if (code.indexOf(1) > -1) {
                context.strokeStyle = value == 2 ? '#FFF' : config.wall_color;
                var pos = this.coord2position(i, j);
                switch (code.join('')) {
                  case '1100':
                    context.beginPath();
                    context.arc(
                      pos.x + this.size / 2,
                      pos.y + this.size / 2,
                      this.size / 2,
                      Math.PI,
                      1.5 * Math.PI,
                      false
                    );
                    context.stroke();
                    context.closePath();
                    break;
                  case '0110':
                    context.beginPath();
                    context.arc(
                      pos.x - this.size / 2,
                      pos.y + this.size / 2,
                      this.size / 2,
                      1.5 * Math.PI,
                      2 * Math.PI,
                      false
                    );
                    context.stroke();
                    context.closePath();
                    break;
                  case '0011':
                    context.beginPath();
                    context.arc(
                      pos.x - this.size / 2,
                      pos.y - this.size / 2,
                      this.size / 2,
                      0,
                      0.5 * Math.PI,
                      false
                    );
                    context.stroke();
                    context.closePath();
                    break;
                  case '1001':
                    context.beginPath();
                    context.arc(
                      pos.x + this.size / 2,
                      pos.y - this.size / 2,
                      this.size / 2,
                      0.5 * Math.PI,
                      1 * Math.PI,
                      false
                    );
                    context.stroke();
                    context.closePath();
                    break;
                  default:
                    var dist = this.size / 2;
                    code.forEach(function (v, index) {
                      if (v) {
                        context.beginPath();
                        context.moveTo(pos.x, pos.y);
                        context.lineTo(
                          pos.x - COS[index] * dist,
                          pos.y - SIN[index] * dist
                        );
                        context.stroke();
                        context.closePath();
                      }
                    });
                }
              }
            }
          }
        }
      },
    });
    // items map
    beans = stage.createMap({
      x: 60,
      y: 10,
      data: config.map,
      frames: 8,
      draw: function (context) {
        for (var j = 0; j < this.y_length; j++) {
          for (var i = 0; i < this.x_length; i++) {
            if (!this.get(i, j)) {
              var pos = this.coord2position(i, j);
              context.fillStyle = '#F5F5DC';
              if (config.goods[i + ',' + j]) {
                context.beginPath();
                context.arc(
                  pos.x,
                  pos.y,
                  3 + (this.times % 2),
                  0,
                  2 * Math.PI,
                  true
                );
                context.fill();
                context.closePath();
              } else {
                context.fillRect(pos.x - 2, pos.y - 2, 4, 4);
              }
            }
          }
        }
      },
    });
    // level score
    stage.createItem({
      x: 690,
      y: 80,
      draw: function (context) {
        context.font = 'bold 24px PressStart2P';
        context.textAlign = 'left';
        context.textBaseline = 'bottom';
        context.fillStyle = '#C33';
        context.fillText('SCORE', this.x, this.y);
        context.font = '24px PressStart2P';
        context.textAlign = 'left';
        context.textBaseline = 'top';
        context.fillStyle = '#FFF';
        context.fillText(score, this.x + 12, this.y + 10);
        context.font = 'bold 24px PressStart2P';
        context.textAlign = 'left';
        context.textBaseline = 'bottom';
        context.fillStyle = '#C33';
        context.fillText('LEVEL', this.x, this.y + 72);
        context.font = '24px PressStart2P';
        context.textAlign = 'left';
        context.textBaseline = 'top';
        context.fillStyle = '#FFF';
        context.fillText(index + 1, this.x + 12, this.y + 82);
      },
    });
    // status text
    stage.createItem({
      x: 690,
      y: 285,
      frames: 25,
      draw: function (context) {
        if (stage.status == 2 && this.times % 2) {
          context.font = '24px PressStart2P';
          context.textAlign = 'left';
          context.textBaseline = 'center';
          context.fillStyle = '#FFF';
          context.fillText('PAUSE', this.x, this.y);
        }
      },
    });
    // life value
    stage.createItem({
      x: 705,
      y: 510,
      width: 30,
      height: 30,
      draw: function (context) {
        var max = Math.min(life - 1, 5);
        for (var i = 0; i < max; i++) {
          var x = this.x + 40 * i,
            y = this.y;
          context.fillStyle = '#FFE600';
          context.beginPath();
          context.arc(
            x,
            y,
            this.width / 2,
            0.15 * Math.PI,
            -0.15 * Math.PI,
            false
          );
          context.lineTo(x, y);
          context.closePath();
          context.fill();
        }
        context.font = '18px PressStart2P';
        context.textAlign = 'left';
        context.textBaseline = 'center';
        context.fillStyle = '#FFF';
        context.fillText('X', this.x - 15, this.y + 30);
        context.font = '24px PressStart2P';
        context.fillText(life - 1, this.x + 10, this.y + 26);
      },
    });
    //NPC
    for (var i = 0; i < 4; i++) {
      stage.createItem({
        width: 30,
        height: 30,
        orientation: 3,
        color: NPC_COLORS[i],
        location: map,
        coord: { x: 12 + i, y: 14 },
        vector: { x: 12 + i, y: 14 },
        type: 2,
        frames: 10,
        speed: 1,
        timeout: Math.floor(Math.random() * 120),
        update: function () {
          var new_map;
          if (this.status == 3 && !this.timeout) {
            this.status = 1;
          }
          if (!this.coord.offset) {
            // when the coordinate is at the center, calculate
            if (this.status == 1) {
              if (!this.timeout) {
                // timer
                new_map = JSON.parse(JSON.stringify(map.data).replace(/2/g, 0));
                var id = this._id;
                items.forEach(function (item) {
                  if (item._id != id && item.status == 1) {
                    // NPC will treat other NPCs that are still in normal status as a wall
                    new_map[item.coord.y][item.coord.x] = 1;
                  }
                });
                this.path = map.finder({
                  map: new_map,
                  start: this.coord,
                  end: player.coord,
                });
                if (this.path.length) {
                  this.vector = this.path[0];
                }
              }
            } else if (this.status == 3) {
              new_map = JSON.parse(JSON.stringify(map.data).replace(/2/g, 0));
              var id = this._id;
              items.forEach(function (item) {
                if (item._id != id) {
                  new_map[item.coord.y][item.coord.x] = 1;
                }
              });
              this.path = map.finder({
                map: new_map,
                start: player.coord,
                end: this.coord,
                type: 'next',
              });
              if (this.path.length) {
                this.vector =
                  this.path[Math.floor(Math.random() * this.path.length)];
              }
            } else if (this.status == 4) {
              new_map = JSON.parse(JSON.stringify(map.data).replace(/2/g, 0));
              this.path = map.finder({
                map: new_map,
                start: this.coord,
                end: this._params.coord,
              });
              if (this.path.length) {
                this.vector = this.path[0];
              } else {
                this.status = 1;
              }
            }
            // whether to change direction
            if (this.vector.change) {
              this.coord.x = this.vector.x;
              this.coord.y = this.vector.y;
              var pos = map.coord2position(this.coord.x, this.coord.y);
              this.x = pos.x;
              this.y = pos.y;
            }
            // direction judgment
            if (this.vector.x > this.coord.x) {
              this.orientation = 0;
            } else if (this.vector.x < this.coord.x) {
              this.orientation = 2;
            } else if (this.vector.y > this.coord.y) {
              this.orientation = 1;
            } else if (this.vector.y < this.coord.y) {
              this.orientation = 3;
            }
          }
          this.x += this.speed * COS[this.orientation];
          this.y += this.speed * SIN[this.orientation];
        },
        draw: function (context) {
          var isSick = false;
          if (this.status == 3) {
            isSick = this.timeout > 80 || this.times % 2 ? true : false;
          }
          if (this.status != 4) {
            context.fillStyle = isSick ? '#BABABA' : this.color;
            context.beginPath();
            context.arc(this.x, this.y, this.width * 0.5, 0, Math.PI, true);
            switch (this.times % 2) {
              case 0:
                context.lineTo(
                  this.x - this.width * 0.5,
                  this.y + this.height * 0.4
                );
                context.quadraticCurveTo(
                  this.x - this.width * 0.4,
                  this.y + this.height * 0.5,
                  this.x - this.width * 0.2,
                  this.y + this.height * 0.3
                );
                context.quadraticCurveTo(
                  this.x,
                  this.y + this.height * 0.5,
                  this.x + this.width * 0.2,
                  this.y + this.height * 0.3
                );
                context.quadraticCurveTo(
                  this.x + this.width * 0.4,
                  this.y + this.height * 0.5,
                  this.x + this.width * 0.5,
                  this.y + this.height * 0.4
                );
                break;
              case 1:
                context.lineTo(
                  this.x - this.width * 0.5,
                  this.y + this.height * 0.3
                );
                context.quadraticCurveTo(
                  this.x - this.width * 0.25,
                  this.y + this.height * 0.5,
                  this.x,
                  this.y + this.height * 0.3
                );
                context.quadraticCurveTo(
                  this.x + this.width * 0.25,
                  this.y + this.height * 0.5,
                  this.x + this.width * 0.5,
                  this.y + this.height * 0.3
                );
                break;
            }
            context.fill();
            context.closePath();
          }
          context.fillStyle = '#FFF';
          if (isSick) {
            context.beginPath();
            context.arc(
              this.x - this.width * 0.15,
              this.y - this.height * 0.21,
              this.width * 0.08,
              0,
              2 * Math.PI,
              false
            );
            context.arc(
              this.x + this.width * 0.15,
              this.y - this.height * 0.21,
              this.width * 0.08,
              0,
              2 * Math.PI,
              false
            );
            context.fill();
            context.closePath();
          } else {
            context.beginPath();
            context.arc(
              this.x - this.width * 0.15,
              this.y - this.height * 0.21,
              this.width * 0.12,
              0,
              2 * Math.PI,
              false
            );
            context.arc(
              this.x + this.width * 0.15,
              this.y - this.height * 0.21,
              this.width * 0.12,
              0,
              2 * Math.PI,
              false
            );
            context.fill();
            context.closePath();
            context.fillStyle = '#000';
            context.beginPath();
            context.arc(
              this.x - this.width * (0.15 - 0.04 * COS[this.orientation]),
              this.y - this.height * (0.21 - 0.04 * SIN[this.orientation]),
              this.width * 0.07,
              0,
              2 * Math.PI,
              false
            );
            context.arc(
              this.x + this.width * (0.15 + 0.04 * COS[this.orientation]),
              this.y - this.height * (0.21 - 0.04 * SIN[this.orientation]),
              this.width * 0.07,
              0,
              2 * Math.PI,
              false
            );
            context.fill();
            context.closePath();
          }
        },
      });
    }
    items = stage.getItemsByType(2);
    // main character
    player = stage.createItem({
      width: 30,
      height: 30,
      type: 1,
      location: map,
      coord: { x: 13.5, y: 23 },
      orientation: 2,
      speed: 2,
      frames: 10,
      update: function () {
        var coord = this.coord;
        if (!coord.offset) {
          if (typeof this.control.orientation != 'undefined') {
            if (
              !map.get(
                coord.x + COS[this.control.orientation],
                coord.y + SIN[this.control.orientation]
              )
            ) {
              this.orientation = this.control.orientation;
            }
          }
          this.control = {};
          var value = map.get(
            coord.x + COS[this.orientation],
            coord.y + SIN[this.orientation]
          );
          if (value == 0) {
            this.x += this.speed * COS[this.orientation];
            this.y += this.speed * SIN[this.orientation];
          } else if (value < 0) {
            this.x -= map.size * (map.x_length - 1) * COS[this.orientation];
            this.y -= map.size * (map.y_length - 1) * SIN[this.orientation];
          }
        } else {
          if (!beans.get(this.coord.x, this.coord.y)) {
            // eat bean
            score++;
            beans.set(this.coord.x, this.coord.y, 1);
            if (config.goods[this.coord.x + ',' + this.coord.y]) {
              // eat energy bean
              items.forEach(function (item) {
                if (item.status == 1 || item.status == 3) {
                  // if NPC is in normal status, set to temporary status
                  item.timeout = 450;
                  item.status = 3;
                }
              });
            }
          }
          this.x += this.speed * COS[this.orientation];
          this.y += this.speed * SIN[this.orientation];
        }
      },
      draw: function (context) {
        context.fillStyle = '#FFE600';
        context.beginPath();
        if (stage.status != 3) {
          // player normal status
          if (this.times % 2) {
            context.arc(
              this.x,
              this.y,
              this.width / 2,
              (0.5 * this.orientation + 0.2) * Math.PI,
              (0.5 * this.orientation - 0.2) * Math.PI,
              false
            );
          } else {
            context.arc(
              this.x,
              this.y,
              this.width / 2,
              (0.5 * this.orientation + 0.01) * Math.PI,
              (0.5 * this.orientation - 0.01) * Math.PI,
              false
            );
          }
        } else {
          // player is eaten
          if (stage.timeout) {
            context.arc(
              this.x,
              this.y,
              this.width / 2,
              (0.5 * this.orientation + 1 - 0.02 * stage.timeout) * Math.PI,
              (0.5 * this.orientation - 1 + 0.02 * stage.timeout) * Math.PI,
              false
            );
          }
        }
        context.lineTo(this.x, this.y);
        context.closePath();
        context.fill();
      },
    });
    // event binding
    stage.bind('keydown', function (e) {
      switch (e.keyCode) {
        case 13: // enter
        case 32: // space
          this.status = this.status == 2 ? 1 : 2;
          break;
        case 39: // right
          player.control = { orientation: 0 };
          break;
        case 40: // down
          player.control = { orientation: 1 };
          break;
        case 37: // left
          player.control = { orientation: 2 };
          break;
        case 38: // up
          player.control = { orientation: 3 };
          break;
      }
    });
  });

  var stage = game.createStage();
  // game over
  stage.createItem({
    x: game.width / 2,
    y: game.height * 0.35,
    draw: function (context) {
      context.fillStyle = '#FFF';
      context.font = 'bold 48px PressStart2P';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(life ? 'YOU WIN!' : 'GAME OVER', this.x, this.y);
    },
  });
  // score
  stage.createItem({
    x: game.width / 2,
    y: game.height * 0.5,
    draw: function (context) {
      context.fillStyle = '#FFF';
      context.font = '20px PressStart2P';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(
        'FINAL SCORE: ' + (score + 50 * Math.max(life - 1, 0)),
        this.x,
        this.y
      );
    },
  });
  // event binding
  stage.bind('keydown', function (e) {
    switch (e.keyCode) {
      case 13: // enter
      case 32: // space
        score = 0;
        life = 5;
        game.setStage(1);
        break;
    }
  });

  const start = () => {
    game.init();
  };
  void document.fonts.ready.then(start).catch(start);

  return () => {
    game.destroy();
  };
}
