(() => {
  const root = document.getElementById("pepero-wireframe");
  const canvas = root.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  const panel = root.querySelector(".choices");
  const feedback = root.querySelector(".feedback");
  const linkField = root.querySelector(".share-link");
  const titles = ["과자색 선택", "초콜릿 선택", "장식 선택", "포장 선택"];
  const options = [
    [["기본", "◯", "#e4b881"], ["코코아", "◉", "#986649"], ["딸기", "●", "#e9a1a8"]],
    [["밀크", "◧", "#925c42"], ["다크", "■", "#482f2b"], ["화이트", "□", "#f7eedb"]],
    [["스프링클", "⁙"], ["별", "★"], ["하트", "♥"], ["아몬드", "◇"], ["쿠키칩", "▪"], ["진주", "○"]],
    [["상자", "▣"], ["봉투", "▱"], ["하트", "♡"], ["원통", "⬭"]]
  ];
  let step = 0;
  let selected = [];
  let busy = false;

  function roundedRect(x, y, width, height, radius, fill, stroke) {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  function draw() {
    ctx.setTransform(3, 0, 0, 3, 0, 0);
    ctx.fillStyle = "#fff7e7";
    ctx.fillRect(0, 0, 338, 316);
    ctx.fillStyle = "#e6c8ac";
    for (let x = 11; x < 338; x += 23) {
      for (let y = 11; y < 316; y += 23) {
        ctx.beginPath();
        ctx.arc(x, y, 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.beginPath();
    ctx.arc(169, 158, 114, 0, Math.PI * 2);
    ctx.fillStyle = "#fff0e8";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(169, 158, 104, 0, Math.PI * 2);
    ctx.fillStyle = "#ffe8e5";
    ctx.fill();
    ctx.font = "28px sans-serif";
    ctx.fillStyle = "#c48076";
    ctx.fillText("✧", 265, 116);
    for (let stick = 0; stick < 2; stick += 1) {
      ctx.save();
      ctx.translate(stick === 0 ? 136 : 202, stick === 0 ? 168 : 177);
      ctx.rotate(stick === 0 ? -0.22 : 0.21);
      roundedRect(-14, -91, 28, 182, 11, options[0][selected[0] ?? 0][2], "#986649");
      roundedRect(6, -87, 5, 173, 3, "#704a4018");
      if (selected[1] !== undefined) {
        roundedRect(-13, -90, 26, 137, 9, options[1][selected[1]][2]);
        roundedRect(-9, -82, 4, 115, 2, "#ffffff30");
      }
      if (selected[2] !== undefined) {
        for (let row = 0; row < 7; row += 1) {
          ctx.save();
          ctx.translate(row % 2 ? 5 : -5, -76 + row * 18);
          ctx.rotate(row * 0.7);
          const topping = selected[2];
          if (topping === 0) {
            roundedRect(-2, -4, 3, 9, 1, row % 2 ? "#e995aa" : "#f8df8f");
            roundedRect(4, 0, 3, 7, 1, "#fdf2d4");
          } else {
            ctx.font = "13px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = ["", "#f7d772", "#ee94aa", "#e6bd8d", "#392b27", "#fff9ef"][topping];
            ctx.fillText(options[2][topping][1], 0, 0);
          }
          ctx.restore();
        }
      }
      ctx.restore();
    }
    if (selected[3] !== undefined) {
      ctx.save();
      const shape = selected[3];
      ctx.beginPath();
      if (shape === 2) {
        ctx.moveTo(169, 282);
        ctx.bezierCurveTo(120, 255, 87, 217, 109, 198);
        ctx.bezierCurveTo(132, 180, 154, 198, 169, 211);
        ctx.bezierCurveTo(190, 187, 211, 185, 229, 200);
        ctx.bezierCurveTo(253, 223, 213, 258, 169, 282);
      } else {
        ctx.roundRect(101, 195, 136, 84, shape === 3 ? 40 : shape === 1 ? [5, 5, 25, 25] : 7);
      }
      ctx.fillStyle = "#f7c9cc";
      ctx.fill();
      ctx.save();
      ctx.clip();
      ctx.fillStyle = "#ffe0df";
      for (let x = 100; x < 245; x += 24) ctx.fillRect(x, 190, 12, 100);
      ctx.restore();
      ctx.strokeStyle = "#704a40";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      roundedRect(102, 225, 134, 12, 0, "#d58e9a");
      ctx.font = "28px sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#a65369";
      ctx.fillText("♥", 169, 243);
      ctx.restore();
    }
    const description = selected.map((value, index) => options[index][value][0]).join(", ");
    canvas.setAttribute("aria-label", "막대과자 두 개" + (description ? " · " + description : ""));
  }

  function notify(message) {
    feedback.hidden = false;
    feedback.textContent = message;
  }

  function render(focus = false) {
    feedback.hidden = true;
    linkField.hidden = true;
    const complete = step === 4;
    root.querySelector("h2").textContent = complete ? "빼빼로 완성!" : titles[step];
    const progress = root.querySelector(".progress-dots");
    progress.setAttribute("aria-label", complete ? "4단계 완료" : `4단계 중 ${step + 1}단계`);
    progress.querySelectorAll("i").forEach((dot, index) => dot.classList.toggle("active", complete || index === step));
    panel.dataset.columns = complete ? "1" : step === 3 ? "2" : "3";
    const choices = complete
      ? [["이미지 저장", "↓"], ["이미지 + 링크 공유", "↗"], ["링크 복사", "↗"], ["다시 만들기", "↻"]]
      : options[step];
    panel.replaceChildren(...choices.map(([label, icon, color], index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "cursor-interaction";
      const mark = document.createElement("span");
      mark.setAttribute("aria-hidden", "true");
      mark.textContent = icon;
      if (step < 2) {
        button.dataset.kind = step === 0 ? "biscuit" : "chocolate";
        button.style.setProperty("--sample", color);
        mark.textContent = "";
      }
      button.append(mark, label);
      button.addEventListener("click", () => choose(index));
      return button;
    }));
    draw();
    if (focus) panel.firstElementChild.focus({ preventScroll: true });
  }

  function imageBlob() {
    return new Promise((resolve, reject) => canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error("이미지를 만들지 못했어요."));
    }, "image/png"));
  }

  async function saveImage() {
    const blob = await imageBlob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "my-pepero.png";
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    notify("이미지 저장을 시작했어요.");
  }

  function siteLink() {
    return new URL("./", location.href).href;
  }

  async function copyLink() {
    const url = siteLink();
    try {
      await navigator.clipboard.writeText(url);
      notify("만들기 사이트 링크를 복사했어요.");
    } catch {
      linkField.hidden = false;
      linkField.value = url;
      linkField.focus();
      linkField.select();
      notify("아래 주소를 길게 누르거나 선택해서 복사해 주세요.");
    }
  }

  async function share() {
    if (!navigator.share) {
      await saveImage();
      await copyLink();
      return;
    }
    const file = new File([await imageBlob()], "my-pepero.png", { type: "image/png" });
    const data = { title: "빼빼로 만들기", text: "나만의 빼빼로를 만들어 봐요!", url: siteLink() };
    if (navigator.canShare?.({ files: [file] })) data.files = [file];
    else await saveImage();
    await navigator.share(data);
    notify("공유를 마쳤어요.");
  }

  async function choose(index) {
    if (busy) return;
    if (step < 4) {
      selected[step] = index;
      step += 1;
      render(true);
      return;
    }
    if (index === 3) {
      selected = [];
      step = 0;
      render(true);
      return;
    }
    busy = true;
    panel.querySelectorAll("button").forEach(button => button.disabled = true);
    try {
      if (index === 0) await saveImage();
      if (index === 1) await share();
      if (index === 2) await copyLink();
    } catch (error) {
      if (error.name !== "AbortError") notify("처리하지 못했어요. 이미지 저장이나 링크 복사를 다시 눌러 주세요.");
    } finally {
      busy = false;
      panel.querySelectorAll("button").forEach(button => button.disabled = false);
    }
  }
  render();
})();
