#!/usr/bin/env node

import fs, { readFileSync } from 'fs'
import path from 'path'
import matter from 'gray-matter'
import marked from 'marked'
import mkdirp from 'mkdirp'
import glob from 'glob'


const links = []
//parse the markdown file, convert to html
const readFile = (filename) =>{
    const rawFile = fs.readFileSync(filename, 'utf8')
    const parsed = matter(rawFile)
    const html = marked(parsed.content)
    return {...parsed, html}
}

//change the file extension from .md to .html
const getOutputFilename = (filename, outPath)=>{
    const basename = path.basename(filename)
    const newFilename = basename.substring(0, basename.length - 3) + '.html'
    const outfile = path.join(outPath, newFilename)
    return outfile


}


const saveFile = (filename, contents) =>{
    const dir = path.dirname(filename)
    mkdirp.sync(dir)
    fs.writeFileSync(filename, contents)

}

// use template to create individual html pages for each markdown file
const makePost = (template, {date, title, content}) => 
    template
        .replace(/<!--date-->/g, date)
        .replace(/<!--title-->/g, title)
        .replace(/<!--content-->/g, content)


    
       
const processFile = (filename, template, outPath) =>{
    const file = readFile(filename)
    const outFileName = getOutputFilename(filename, outPath)
    const templated = makePost(template, 
        {date: file.data.date, 
        title: file.data.title, 
        content: file.html})

    saveFile(outFileName, templated)

const link = path.basename(outFileName)
const title = file.data.title
links.push({title: title, link: link })
}

//putting it all together -> reading, parsing, processing + writing html files from markdown files and saving it to a dist folder. 
const main = () => {
    const srcPath = path.join(path.resolve(), 'src')
    const outPath = path.join(path.resolve(), 'dist')
    const template = readFileSync(
        path.join(srcPath, 'template.html'), 
        'utf8'
        )
    const filenames = glob.sync(srcPath + '/pages/**/*.md')
    filenames.forEach((filename) =>{
        processFile(filename, template, outPath)
    })
    

    
    
}
main();


const makeIndexPage = (template, content) =>
    template
        .replace(/<!--content-->/g, content)
    


const index = () =>{
    const srcPath = path.join(path.resolve(), 'src')
    const indexTemplate = readFileSync(
        path.join(srcPath, 'homeTemplate.html'), 
        'utf8'
        )
    const outPath = path.join(path.resolve(), 'dist')
    let str = ''
    const list = links.forEach(item=>{
        str +=`<a href="${item.link}"><li> ${item.title} </li></a>\n`
    })

    const indexPage = makeIndexPage(indexTemplate, str)
    saveFile(outPath + '/index.html', indexPage)
}
index();

//create index page with links to all pages
export default {main, index}




