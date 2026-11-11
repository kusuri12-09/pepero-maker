(() => {
  const root = document.getElementById("pepero-wireframe");
  const canvas = root.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  const scene = root.querySelector(".pepero-scene");
  const preview = root.querySelector(".preview");
  new ResizeObserver(([entry]) => {
    scene.style.scale = Math.max(0, Math.min(1, (entry.contentRect.width - 20) / 360, (entry.contentRect.height - 12) / 356));
    canvas.style.width = Math.max(24, Math.min(430, entry.contentRect.width - 32, (entry.contentRect.height - 12 - 46) * 1080 / 1068 + 24)) + "px";
  }).observe(preview);
  const sticks = root.querySelectorAll(".pepero-stick");
  const packagePreview = root.querySelector(".package-preview");
  const panel = root.querySelector(".choices");
  const backButton = root.querySelector(".back-button");
  const selectionArea = root.querySelector(".selection-area");
  const trayToggle = root.querySelector(".tray-toggle");
  const trayContent = root.querySelector("#tray-content");
  trayToggle.addEventListener("click", () => {
    const collapsed = selectionArea.classList.toggle("is-collapsed");
    trayToggle.setAttribute("aria-expanded", String(!collapsed));
    trayToggle.setAttribute("aria-label", collapsed ? "트레이 펼치기" : "트레이 접기");
    trayContent.inert = collapsed;
    trayContent.setAttribute("aria-hidden", String(collapsed));
  });
  const feedback = root.querySelector(".feedback");
  const linkField = root.querySelector(".share-link");
  const titles = ["과자색", "초콜릿", "장식", "포장"];
  const options = [
    [["밀크", "◯", "#f5e6bd"], ["버터", "●", "#f4df9b"], ["코코아", "◉", "#55463e"]],
    [["딸기", "●", "#ffc1cc"], ["다크", "■", "#3e3027"], ["화이트", "□", "#f7eedb"]],
    [["화이트 드리즐", "〰"], ["초코 드리블", "〰"], ["스프링클", "⁙"], ["아몬드", "◇"], ["쿠키칩", "▪"], ["딸기", "●"]],
    [["원", "○"], ["하트", "♡"], ["별", "★"], ["클로버", "♣"]]
  ];
  const iconFiles = [[], ["strawberry", "chocolate", "cream"], ["cream-drizzle", "chocolate-drizzle", "sprinkles", "almond", "cookie", "strawberry"], ["circle", "heart", "star", "clover"]];
  const doilyFiles = ["doily-circle", "doily-heart", "doily-star", "doily-clover"];
  const crumbFiles = { 2: "topping-sprinkles", 3: "crumb-almond", 4: "crumb-cookie", 5: "crumb-strawberry" };
  const images = new Map();
  const imageLoads = [...new Set([...iconFiles.flat(), ...doilyFiles, ...Object.values(crumbFiles)])].map(name => new Promise((resolve, reject) => {
    const image = new Image();
    images.set(name, image);
    image.onload = () => { draw(); resolve(); };
    image.onerror = () => reject(new Error("아이콘을 불러오지 못했어요."));
    image.src = "public/icons/" + name + ".svg?v=17";
  }));
  const imagesReady = Promise.all(imageLoads);
  imagesReady.catch(() => notify("아이콘을 불러오지 못했어요. 새로고침해 주세요."));
  let step = 0;
  let selected = [];
  let busy = false;
  backButton.addEventListener("click", () => {
    if (busy || step === 0) return;
    step -= 1;
    render(true);
  });

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
    ctx.fillStyle = "#b8875d";
    ctx.fillRect(0, 0, 360, 356);
    const light = ctx.createLinearGradient(0, 0, 360, 60);
    light.addColorStop(0, "#e9c59d38");
    light.addColorStop(0.55, "#ffffff00");
    light.addColorStop(1, "#67412830");
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, 360, 356);
    ctx.strokeStyle = "#603d2114";
    ctx.lineWidth = 1;
    for (let y = -12; y < 368; y += 17) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(360, y + 12);
      ctx.stroke();
    }
    for (let y = 110; y < 356; y += 112) {
      ctx.fillStyle = "#69432638";
      ctx.fillRect(0, y, 360, 1);
      ctx.fillStyle = "#efd1ac24";
      ctx.fillRect(0, y + 1, 360, 1);
    }
    ctx.save();
    ctx.shadowColor = "#71502b14";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 5;
    ctx.beginPath();
    ctx.arc(180, 180, 170, 0, Math.PI * 2);
    ctx.fillStyle = "#e9e0d1";
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.beginPath();
    ctx.arc(180, 178, 170, 0, Math.PI * 2);
    ctx.fillStyle = "#fdfdfb";
    ctx.fill();
    const innerEdge = ctx.createRadialGradient(180, 178, 0, 180, 178, 170);
    innerEdge.addColorStop(0, "#eeefec");
    innerEdge.addColorStop(0.79, "#eeefec");
    innerEdge.addColorStop(0.805, "#e5e6e2");
    innerEdge.addColorStop(0.82, "#fdfdfb");
    innerEdge.addColorStop(1, "#fdfdfb");
    ctx.fillStyle = innerEdge;
    ctx.fill();
    ctx.restore();
    ctx.translate(11, 20);
    packagePreview.hidden = selected[3] === undefined;
    packagePreview.style.backgroundImage = selected[3] === undefined ? "none" : 'url("public/icons/' + doilyFiles[selected[3]] + '.svg?v=17")';
    if (selected[3] !== undefined) {
      const image = images.get(doilyFiles[selected[3]]);
      if (image.complete && image.naturalWidth) {
        ctx.save();
        ctx.shadowColor = "#71502b20";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 3;
        ctx.drawImage(image, 23, 12, 292, 292);
        ctx.restore();
      }
    }
    sticks.forEach((element, index) => {
      const biscuit = options[0][selected[0] ?? 0][2];
      const chocolate = selected[1] === undefined ? "transparent" : options[1][selected[1]][2];
      const topping = selected[2];
      const whiteDrizzle = selected[1] === 2 ? "#fffaf0" : "#fff5e2";
      element.style.setProperty("--biscuit", biscuit);
      element.style.setProperty("--stick-shadow", "#69534452");
      element.style.setProperty("--chocolate", chocolate);
      const decoration = element.querySelector(".toppings");
      decoration.classList.toggle("sauce", topping === 0 || topping === 1);
      decoration.classList.toggle("crumbs", topping in crumbFiles);
      decoration.textContent = "";
      decoration.style.backgroundColor = topping === 0 ? whiteDrizzle : topping === 1 ? "#593b2c" : "transparent";
      decoration.style.backgroundImage = topping > 1 ? 'url("public/icons/' + (crumbFiles[topping] ?? iconFiles[2][topping]) + '.svg?v=11")' : "none";
      ctx.save();
      ctx.translate(111 + index * 72, 22);
      ctx.shadowColor = "#69534452";
      ctx.shadowBlur = 5;
      ctx.shadowOffsetX = 4;
      ctx.shadowOffsetY = 6;
      roundedRect(0, 0, 44, 270, 24, biscuit);
      ctx.shadowColor = "transparent";
      roundedRect(-3, -3, 50, 227, 25, chocolate);
      if (topping === 0 || topping === 1) {
        const clip = getComputedStyle(decoration).clipPath;
        const path = clip.slice(clip.indexOf('"') + 1, clip.lastIndexOf('"'));
        ctx.translate(-13, 15);
        ctx.fillStyle = topping === 0 ? whiteDrizzle : "#593b2c";
        ctx.fill(new Path2D(path));
      } else if (topping > 1) {
        const image = images.get(crumbFiles[topping] ?? iconFiles[2][topping]);
        if (image.complete && image.naturalWidth) {
          if (topping in crumbFiles) ctx.drawImage(image, -11, -11, 66, 243);
          else for (let row = 0; row < 6; row += 1) ctx.drawImage(image, 12, 20 + row * 29, 20, 29);
        }
      }
      ctx.restore();
    });
    const description = selected.map((value, index) => options[index][value][0]).join(", ");
    scene.setAttribute("aria-label", "막대과자 두 개" + (description ? " · " + description : ""));
    canvas.setAttribute("aria-label", "완성된 빼빼로 · " + description);
  }

  function notify(message) {
    feedback.hidden = false;
    feedback.textContent = message;
  }

  function render(focus = false) {
    backButton.hidden = step === 0;
    feedback.hidden = true;
    linkField.hidden = true;
    const complete = step === 4;
    root.querySelector(".phone").classList.toggle("is-complete", complete);
    canvas.setAttribute("aria-hidden", String(!complete));
    canvas.setAttribute("role", "img");
    trayToggle.hidden = complete;
    root.querySelector("h2").textContent = complete ? "빼빼로 완성!" : titles[step];
    const progress = root.querySelector(".progress-dots");
    progress.setAttribute("aria-label", complete ? "4단계 완료" : `4단계 중 ${step + 1}단계`);
    progress.querySelectorAll("i").forEach((dot, index) => dot.classList.toggle("active", complete || index <= step));
    panel.dataset.columns = complete ? "1" : step === 3 ? "4" : "3";
    panel.dataset.step = String(step);
    const choices = complete
      ? [["이미지 저장하기", "↓"], ["공유하기", "↗"]]
      : options[step];
    panel.replaceChildren(...choices.map(([label, icon, color], index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "cursor-interaction";
      if (!complete) button.setAttribute("aria-pressed", String(selected[step] === index));
      const mark = document.createElement("span");
      mark.setAttribute("aria-hidden", "true");
      if (!complete) {
        mark.className = "option-icon";
        mark.classList.toggle("light-icon", (step === 0 && index < 2) || (step === 1 && index === 2) || (step === 2 && (index === 0 || index === 3)));
      }
      mark.textContent = icon;
      if (step < 2) {
        button.dataset.kind = step === 0 ? "biscuit" : "chocolate";
        button.style.setProperty("--sample", color);
        mark.textContent = "";
      }
      if (complete) {
        button.setAttribute("aria-label", label);
        const paths = index === 0
          ? '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" />'
          : '<path d="M8 16 20 4M10 4h10v10M5 8H3v13h13v-2" />';
        mark.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + paths + '</svg>';
        button.append(mark, label);
      } else {
        if (step > 0) {
          const image = document.createElement("img");
          image.src = "public/icons/" + iconFiles[step][index] + ".svg";
          image.alt = "";
          image.width = 36;
          image.height = 36;
          mark.replaceChildren(image);
          delete button.dataset.kind;
        }
        button.append(mark, label);
      }
      button.addEventListener("click", () => choose(index));
      return button;
    }));
    draw();
    panel.scrollTop = 0;
    if (focus) panel.firstElementChild.focus({ preventScroll: true });
  }

  async function imageBlob() {
    await imagesReady;
    draw();
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
    showButtonFeedback(0, "저장되었어요!", "이미지 저장하기");
  }

  function siteLink() {
    return new URL("./", location.href).href;
  }

  const buttonResetTimers = [];
  function showButtonFeedback(index, message, label) {
    feedback.hidden = true;
    const button = panel.querySelectorAll("button")[index];
    button.lastChild.textContent = message;
    button.setAttribute("aria-label", message);
    clearTimeout(buttonResetTimers[index]);
    buttonResetTimers[index] = setTimeout(() => {
      button.lastChild.textContent = label;
      button.setAttribute("aria-label", label);
    }, 2000);
  }
  async function copyLink() {
    const url = siteLink();
    try {
      await navigator.clipboard.writeText(url);
      linkField.hidden = true;
      showButtonFeedback(1, "복사되었어요!", "공유하기");
    } catch {
      linkField.hidden = false;
      linkField.value = url;
      linkField.focus();
      linkField.select();
      notify("아래 주소를 길게 누르거나 선택해서 복사해 주세요.");
    }
  }

  async function shareImage() {
    const file = new File([await imageBlob()], "my-pepero.png", { type: "image/png" });
    if (!navigator.share || !navigator.canShare?.({ files: [file] })) {
      await copyLink();
      return;
    }
    try {
      await navigator.share({ files: [file], title: "나만의 빼빼로" });
      showButtonFeedback(1, "공유했어요!", "공유하기");
    } catch (error) {
      if (error.name !== "AbortError") await copyLink();
    }
  }

  async function choose(index) {
    if (busy) return;
    if (step < 4) {
      if (selected[step] !== index) {
        selected[step] = index;
        panel.querySelectorAll("button").forEach((button, optionIndex) => {
          button.setAttribute("aria-pressed", String(optionIndex === index));
        });
        draw();
        return;
      }
      step += 1;
      render(true);
      return;
    }
    busy = true;
    backButton.disabled = true;
    panel.querySelectorAll("button").forEach(button => button.disabled = true);
    try {
      if (index === 0) await saveImage();
      if (index === 1) await shareImage();
    } catch (error) {
      if (error.name !== "AbortError") notify("처리하지 못했어요. 이미지 저장이나 링크 복사를 다시 눌러 주세요.");
    } finally {
      busy = false;
      backButton.disabled = false;
      panel.querySelectorAll("button").forEach(button => button.disabled = false);
    }
  }
  render();
})();
