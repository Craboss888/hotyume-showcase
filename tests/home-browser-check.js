async (page) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const results = [];
  for (const [width, height] of [[1440,1000], [1024,768], [390,844]]) {
    await page.setViewportSize({width,height});
    await page.goto('http://127.0.0.1:8911/');
    await page.emulateMedia({reducedMotion:'reduce',colorScheme:width===1024?'light':'dark'});
    const cards = page.locator('[data-wallpaper-card]');
    for (let i=0;i<6;i++) await cards.nth(i).click();
    await page.waitForFunction(() => document.querySelectorAll('.phone-card.is-live').length===6);
    const measure = await page.evaluate(() => {
      const rects = [...document.querySelectorAll('.phone-screen')].map(x=>x.getBoundingClientRect());
      const overlaps = rects.flatMap((a,i)=>rects.slice(i+1).filter(b=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top).map(()=>i));
      return {overflow:document.documentElement.scrollWidth>innerWidth,overlaps,playing:[...document.querySelectorAll('video')].every(v=>!v.paused&&v.currentTime>0)};
    });
    if(measure.overflow||measure.overlaps.length||!measure.playing) throw Error(JSON.stringify({width,...measure}));
    await cards.first().click();
    if(await cards.first().getAttribute('aria-pressed')!=='false') throw Error('暂停失败');
    await cards.first().click();
    await page.waitForFunction(()=>document.querySelector('.phone-card').classList.contains('is-live'));

    for(const selector of ['#factory','#factory-entry','#vision','#creator-platform','.judgment-lab']) {
      await page.locator(selector).scrollIntoViewIfNeeded();
      if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)) throw Error('浏览时横向溢出 '+selector);
    }
    const link=page.locator('.factory-entry-grid a').first();
    await link.scrollIntoViewIfNeeded();
    const before=await page.evaluate(()=>scrollY);
    await link.click();
    await page.waitForURL('**/factory.html#production');
    await page.goBack();
    await page.waitForFunction(y=>Math.abs(scrollY-y)<2,before);
    results.push({width,height,...measure,returnPosition:true,secondPlayback:true});
  }
  if(errors.length) throw Error(errors.join('\n'));
  return {results,errors};
}
