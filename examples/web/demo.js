class Demo {
  constructor() {
    this.testMenu = document.getElementById('test-menu');
    this.testPicker = document.getElementById('testPicker');
    this.testFrame = document.getElementById("page");
    this.regionUpdaters = [];
    this._injectGlue();
    this._updateSrc(this.testPicker.value);
    window.demo = this;

    this.testFrame.addEventListener('load', () => {
        if (this.keyGlue && this.keyGlue.destroy) this.keyGlue.destroy();
        if (this.eventGlue && this.eventGlue.destroy) this.eventGlue.destroy();
        if (this.linkGlue && this.linkGlue.destroy) this.linkGlue.destroy();
        if (this.selGlue && this.selGlue.destroy) this.selGlue.destroy();
        if (this.regiGlue && this.regiGlue.destroy) this.regiGlue.destroy();
        if (this.generateCFI && this.generateCFI.destroy) this.generateCFI.destroy();

        this.selGlue = new ReadiumGlue.SelectionHandling(this.testFrame.contentWindow);
        this.keyGlue = new ReadiumGlue.KeyHandling(this.testFrame.contentWindow);
        this.eventGlue = new ReadiumGlue.EventHandling(this.testFrame.contentWindow);
        this.regiGlue = new ReadiumGlue.RegionHandling(this.testFrame.contentWindow);
        this.linkGlue = new ReadiumGlue.LinkHandling(this.testFrame.contentWindow);
        this.generateCFI = new ReadiumGlue.GenerateCFI(this.testFrame.contentWindow);
        this.highlighting = new ReadiumGlue.Highlighting(this.testFrame.contentWindow);
    });

    this.testPicker.onchange = () => {
      this._updateSrc(this.testPicker.value);
    };
  }

  testChanged() {
    let el = this.testPicker;
    let testIndex = el && el.selectedIndex;
    this._clearMenu();
    // Change page on key press
    this.keyGlue.addKeyEventListener('keyup', (event) => {
      this._handleKeyInput(event);
    });
    this._addPageNavigationButtons();
    this._addSelectionHandling();
    this._addRegionHandling();
    this._addLinkHandling();

    switch (testIndex) {
      case 1: // Form elements
        this._addAlert('input:nth-child(6)', 'Reset was clicked!' );
        this._addAlert('input:nth-child(7)', 'Submit was clicked!' );
        break;
      default:
        break;
    }
  }

  setTest(id) {
    const picker = this.testPicker;
    picker.options.selectedIndex = id;
    this._updateSrc(picker.value);
  }

  flipPages(num) {
    if (this.disablePageFlipOnce) {
      this.disablePageFlipOnce = false;
      return;
    }
    let frame = this.testFrame;
    let gap = parseInt(window.getComputedStyle(frame.contentWindow.document.documentElement).getPropertyValue("column-gap"));
    const win = frame.contentWindow;
    const bodyWidth = frame.contentDocument.body.getBoundingClientRect().width;
    const scrollVal = win.scrollX + (win.innerWidth - gap) * num;
    win.scrollTo(scrollVal, 0);

    this.regionUpdaters.forEach(updater => updater());
  }

  nextPage() {
    this.flipPages(1);
  }

  previousPage() {
    this.flipPages(-1);
  }

  pausePlayback() {
    this.togglePlayback(false);
  }

  startPlayback() {
    this.togglePlayback(true);
  }

  stopPlayback() {
    this.togglePlayback(false, 0);
  }

  jumpPlayback(time) {
    this.togglePlayback(undefined, time, true);
  }

  togglePlayback(state, timePos, shouldAddTime) {
    const win = this.testFrame.contentWindow;
    const track = win.document.getElementById('track');
    state = (state === undefined && !shouldAddTime) ? track.paused : !track.paused;

    if (state) {
      track.play();
    } else {
      track.pause();
    }

    if (timePos !== undefined) {
      track.currentTime = shouldAddTime ? track.currentTime + timePos : timePos;
    }
  }

  hasMediaPlayback() {
    const track = this.testFrame.contentWindow.document.getElementById('track');
    return !!track;
  }

  async _addAlert(tagName, message) {
    let tag = tagName.split(':')[0];
    this.eventGlue.addEventListener('click', (info) => {
      if (info.target === tagName) {
        window.alert(message);
      }
    }, {
      target: tag,
    });
  }

  async _addPageNavigationButtons() {
    // Previous page button
    let button = document.createElement('button');
    button.textContent = 'Previous Page';
    this.testMenu.appendChild(button);
    button.addEventListener('click', () => {
      this.previousPage();
    });

    // Next page button
    button = document.createElement('button');
    button.textContent = 'Next Page';
    this.testMenu.appendChild(button);
    button.addEventListener('click', () => {
      this.nextPage();
    });
  }

  async _addLinkHandling() {
    this.linkGlue.addEventListener('click', (opts) => {
      const href = opts.href;

      const arr1 = href.split('#');
      const hash = arr1[1];
      const arr2 = arr1[0].split('/');
      const testPage = arr2[arr2.length-1];

      if (!hash) {
        // Get the number of the test, and use it to change tests
        const index = testPage.indexOf('test-');
        const num = Number.parseInt(testPage.slice(index+5, index+8));
        this.setTest(num);
      }
    });
  }

  async _addSelectionHandling() {
    this.selGlue.addEventListener('body', (opts) => {
      const rangeData = opts.rangeData;
      if (rangeData && !rangeData.collapsed) {
        console.log(opts.text);

        this.disablePageFlipOnce = true;
      }
    });
  }

  async _addRegionHandling() {
    const viewportSize = this.testFrame.getBoundingClientRect();

    let prevPageRegion = {
      left: 0,
      top: 0,
      width: viewportSize.width / 2,
      height: viewportSize.height,
      scope: 'document',
    };
    this.regiGlue.addEventListener('click', prevPageRegion, () => {
      this.previousPage();
    }).then((id) => {
      this.regionUpdaters.push(() => {
        const size = this.testFrame.contentDocument.body.getBoundingClientRect();
        prevPageRegion.left = size.left * -1;
        this.regiGlue.setRegion(prevPageRegion, id);
      });
    });

    let nextPageRegion = {
      left: viewportSize.width / 2,
      top: 0,
      width: viewportSize.width / 2,
      height: viewportSize.height,
      scope: 'document',
    };
    this.regiGlue.addEventListener('click', nextPageRegion, () => {
      this.nextPage();
    }).then((id) => {
      this.regionUpdaters.push(() => {
        const size = this.testFrame.contentDocument.body.getBoundingClientRect();
        prevPageRegion.left = size.left * -1 + viewportSize.width/2;
        this.regiGlue.setRegion(prevPageRegion, id);
      });
    });
  }

  _handleKeyInput(event) {
    if (event.key === 'ArrowLeft') {
      this.previousPage();
    } else if (event.key === 'ArrowRight') {
      this.nextPage();
    }

    if (this.hasMediaPlayback()) {
      if (event.key === ' ') {
        this.togglePlayback();
      } else if (event.key === 'ArrowRight') {
        this.jumpPlayback(10);
      } else if (event.key === 'ArrowLeft') {
        this.jumpPlayback(-10);
      } else if (event.key === 'Backspace') {
        this.stopPlayback();
      }
    }
  }

  _clearMenu() {
    let menu = this.testMenu;
    while (menu.hasChildNodes()) {
      menu.removeChild(menu.lastChild);
    }
  }

  _updateSrc(url) {
    const prefix = "src/";
    const frame = this.testFrame;
    frame.src = prefix + url;
  }

  _injectGlue() {
    const frame = this.testFrame;
    frame.addEventListener('load', () => {
      const script = frame.contentDocument.createElement("script");
      script.setAttribute("src", "/dist/glue-embed.js");
      const script2 = frame.contentDocument.createElement("script");
      script2.setAttribute("src", "/dist/glue-caller.js");
      frame.contentDocument.head.appendChild(script);
      frame.contentDocument.head.appendChild(script2);

      script.addEventListener('load', () => {
          this.testChanged();
      });
    });
  }
}