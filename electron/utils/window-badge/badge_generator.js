export default class BadgeGenerator {
  constructor(win, opts = {}) {
    const defaultStyle = {
      fontColor: "white",
      font: "24px arial",
      color: "red",
      fit: true,
      decimals: 0,
      radius: 8,
      overflowCount: 99,
    };
    this.win = win;
    this.style = Object.assign(defaultStyle, opts);
  }

  generate(number) {
    const opts = JSON.stringify(this.style);
    return this.win.webContents.executeJavaScript(
      `window.drawBadge = function ${this.drawBadge}; window.drawBadge(${number}, ${opts});`,
    );
  }

  drawBadge(number, style) {
    var radius = style.radius;
    var img = document.createElement("canvas");
    img.width = Math.ceil(radius * 2);
    img.height = Math.ceil(radius * 2);
    img.ctx = img.getContext("2d");
    img.radius = radius;
    img.number = number;
    img.displayStyle = style;

    style.color = style.color ? style.color : "red";
    style.font = style.font ? style.font : "18px arial";
    style.fontColor = style.fontColor ? style.fontColor : "white";
    style.fit = style.fit === undefined ? true : style.fit;
    style.decimals =
      style.decimals === undefined || isNaN(style.decimals) ? 0 : style.decimals;

    img.draw = function () {
      var fontSize, number;
      this.width = Math.ceil(this.radius * 2);
      this.height = Math.ceil(this.radius * 2);
      this.ctx.clearRect(0, 0, this.width, this.height);
      this.ctx.fillStyle = this.displayStyle.color;
      this.ctx.beginPath();
      this.ctx.arc(radius, radius, radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillStyle = this.displayStyle.fontColor;
      number = this.number.toFixed(this.displayStyle.decimals);
      fontSize = Number(/[0-9\.]+/.exec(this.ctx.font)[0]);
      if (number > this.displayStyle.overflowCount) {
        number = `${this.displayStyle.overflowCount}+`;
        this.ctx.font = "8px arial";
      } else {
        this.ctx.font = this.displayStyle.font;
      }

      if (!this.displayStyle.fit || isNaN(fontSize)) {
        this.ctx.fillText(number, radius, radius);
      } else {
        this.ctx.fillText(number, this.width / 2, this.height / 2);
      }
      return this;
    };

    img.draw();
    return img.toDataURL();
  }
}
