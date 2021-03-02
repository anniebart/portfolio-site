#!/usr/bin/env node

import fs, { readFileSync } from 'fs'
import path from 'path'
import matter from 'gray-matter'
import marked from 'marked'
import mkdirp from 'mkdirp'
import glob from 'glob'
import Jimp from 'jimp'


//links will contain objects with links + titles to all the posts
const links = []
//parse the markdown file, convert to html
const readFile = (filename) =>{
    const rawFile = fs.readFileSync(filename, 'utf8')
    const parsed = matter(rawFile)
    const html = marked(parsed.content)
    
    return {...parsed, html}
}

//dither + resize image using Jimp
const ditherImage = (url) => Jimp.create(url)
  .then(image => {
    let img = image.clone()
    img.dither16()
    const basename = path.basename(url)
    const outPath = path.join(path.resolve(), '/public/assets/images')
    img.writeAsync(outPath + basename)            // ordered dithering of the image and reduce color space to 16-bits (RGB565)
  })
  .catch(err => {
    console.log(err)
  });




 

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
        .replace(/{{description}}/g, description)
        .replace(/<!--page-title-->/g, title)
        .replace(/<!--content-->/g, content)

const makeHomePage = (template, {content, title, description}) => 
        template
            .replace(/<!--date-->/g, " ")
            .replace(/<!--title-->/g, " ")
            .replace(/{{description}}/g, description)
            .replace(/<!--page-title-->/g, title)
            .replace(/<!--content-->/g, content)

const makeAboutPage = (template, {content, title}) => 
        template
            .replace(/<!--date-->/g, " ")
            .replace(/<!--title-->/g, title)
            .replace(/<!--page-title-->/g, title)
            .replace(/{{description}}/g, description)
            .replace(/<!--content-->/g, content)
       
const processFile = (filename, template, outPath) =>{
    const file = readFile(filename)
    const outFileName = getOutputFilename(filename, outPath)
    const parentDir = path.basename(path.dirname(filename))
    if (parentDir == 'index') {
        const templated = makeHomePage(template, {content: "<div class='index'>" + file.html + "</div>", description: file.data.description,})
        saveFile(outFileName, templated)
    } 
    else if (parentDir =='about'){
        const templated = makeAboutPage(template, {content: file.html, title: file.data.title, description: file.data.description,})
        saveFile(outFileName, templated)
    } 
    
    else{
        const templated = makePost(template, 
            {date: file.data.date, 
            title: file.data.title, 
            description: file.data.description,
            content: file.html})
            saveFile(outFileName, templated)
            
    }

        
        if (parentDir == 'projects'){
            const link = path.basename(outFileName)
            const cat = file.data.category
            let title = file.data.title
            if (title.length > 40) title = title.slice(0, 40) + '...'
            const date = file.data.date
            links.push({title: title, date: date, link: link, cat: cat })
        }
        
        }
//putting it all together -> reading, parsing, processing + writing html files from markdown files and saving it to a dist folder. 
const main = () => {
    const srcPath = path.join(path.resolve(), 'src')
    const outPath = path.join(path.resolve(), 'site')
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

//make index page template
//make projects page template
const makeProjectPage = (template, {content, description}) =>
    template
        .replace(/{{content}}/g, content)
        .replace(/{{description}}/g, description)
//create index page with links to all pages
const projects = () =>{
    const srcPath = path.join(path.resolve(), 'src')
    const indexTemplate = readFileSync(
        path.join(srcPath, 'projectsTemplate.html'), 
        'utf8'
        )
    const outPath = path.join(path.resolve(), 'site')
    let indexStr = ''
    let otherStr = ''
    indexLinks.sort((a, b)=>{
        if (a.date > b.date) return -1
        else return 1
    })
    otherLinks.sort((a, b)=>{
        if (a.date > b.date) return -1
        else return 1
    })
    
    const indexList = indexLinks.forEach(item=>{
        indexStr +=`<a href="${item.link}"><li class="postSquare"> <h6>${item.title}</h6><h6>${item.cat}</h6><h6>${item.date} </h6></li></a>`
    })
    const otherList = otherLinks.forEach(item=>{
        otherStr +=`<a href="${item.link}"><li class="postSquare"> <h6>${item.title}</h6><h6>${item.cat}</h6><h6>${item.date} </h6></li></a>`
    })

    const indexPage = makeProjectPage(indexTemplate, {content: indexStr, description: 'Annie Bartholomew is a designer, programmer and artist. Past projects include speculative designs for authentication methods and message sending, various design work for Our Climate Voices + freelance digital design work. She is an alum of Recurse Center.'})
    const otherPage = makeProjectPage(indexTemplate, {content: otherStr, description: 'Annie Bartholomew is a designer, artist + programmer'})
    saveFile(outPath + '/projects.html', indexPage)
    saveFile(outPath+ '/other.html', otherPage)
}
projects();

export default {main, projects}




