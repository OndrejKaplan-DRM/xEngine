// Po startu xView: přepínač levelů do panelu; pohledy „Laboratoř“ a „Hala“ patří zlatému vzorku, tady nedávají smysl.
const { levels, current } = globalThis.__xgen;
for (const name of ['lab', 'hall']) document.querySelector(`#views button[data-view="${name}"]`)?.remove();
const row = document.createElement('div');
row.className = 'row';
row.id = 'levels';
levels.forEach((l, i) => {
  const b = document.createElement('button');
  b.textContent = l.title;
  b.className = i === current ? 'on' : '';
  b.onclick = () => {
    location.search = `?level=${i}`;
  };
  row.appendChild(b);
});
document.getElementById('panel').appendChild(row);
