



# Startup : 

- Have Node JS et Yarn installed. 

- run "yarn" to install node_modules

- There is a configuration for VSCode : just press F5 to start debuging 


# Info

- I left many console logs

- The official documentation to start developing an extension :
https://code.visualstudio.com/api/get-started/your-first-extension

-----------------------------------------------------------------------------------------------------------

### Building vsix (extension package)

First, install vsce globally
```
$ npm install -g vsce
```

Then, run 
```
$ vsce package
```





### Some Java/Typescript && vscode hints: 

- it's my old personal notes, to be moved somewhere else

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