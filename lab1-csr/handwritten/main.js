// 任务一选做：手写版 CSR —— 不经过 Vite，双击 index.html 即可运行
// 与 Vite 版的区别只在于没有开发服务器、热更新和打包能力；
// 渲染本质完全相同：首屏是空壳，内容由浏览器执行 JS 之后才出现。

var posts = Array.from({ length: 10 }, function (_, i) {
  return {
    id: i + 1,
    title: '文章标题 ' + (i + 1),
    body: '这是第 ' + (i + 1) + ' 篇文章的正文内容……'
  };
});

var app = document.getElementById('app');
app.innerHTML =
  '<h1>文章列表</h1>' +
  posts
    .map(function (p) {
      return '<article><h2>' + p.title + '</h2><p>' + p.body + '</p></article>';
    })
    .join('');

app.insertAdjacentHTML(
  'beforeend',
  '<p>渲染模式：CSR（手写版）｜ 右键查看源代码，这里依然是空的 —— 这就是 CSR</p>'
);
