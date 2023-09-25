



### Pour débuter : 

- Avoir Node JS et NPM installé

- Lancer un npm install

- Allez sur extension.ts et faire un F5

- Normalement ca va lancer le nécéssaire >> Attention il est préférable d'avoir cmd comme console par défaut (surtout pas cmder ca plante chez moi)
En fait un nouveau vscode s'ouvre. L'idéal est de se créer un workspace avec des trucs pour faire des tests dedans (genre des sql).

- y'a pas mal de debug qui apparait dans la debug console de vscode

- On peut modifier le code 'en live'. Une fois la modif réalisée, on retourne dans le vscode de test et on fait un ctrl-r pour recharger

- Pour lancer une "commande" c'est ctrl-shift-p > actuellement la seule que j'ai créée est "Starting BQ Helper"




Si on veut partir de zéro, à ne pas faire dans ce repo ci :

Pour commencer à developper une extension :
https://code.visualstudio.com/api/get-started/your-first-extension

avoir Git, Node.JS
Installer Yeoman et VSCode Extension : 
'''
npm install -g yo generator-code
'''
'''
yo code 
'''

-----------------------------------------------------------------------------------------------------------

### Building vsix (extension package)

First, install vsce globally

$ npm install -g vsce

then run 

$ vsce package



### Some Java/Typescript && vscode hints: 

#### Utilisation de .then()

Lorsqu'on veut executer du code après une promesse, on peut utiliser ".then()"

Le format est :

maPromesse.then( (xxx) =>  {     
    code à executer;
});

xxx peut être quelque chose renvoyé par la promesse. (le resolve)
See : https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/then



#### Aller à un endroit précis d'un fichier

Il faut avoir un "range" (ici displayRange). On peut passer un second paramètre pour indiquer le comportement (début, fin, milieu...)
editor.revealRange(displayRange, vs.TextEditorRevealType.InCenterIfOutsideViewport);
editor.revealRange(new vs.Range(displayRange.start, displayRange.start), vs.TextEditorRevealType.Default);


#### Compter les occurences dans une chaine de caractères

let temp = "Welcome to W3Docs";
let count = (temp.match(/to/g) || []).length;
console.log(count);