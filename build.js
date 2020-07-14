const {
    Liquid
} = require('liquidjs')
const {
    Octokit
} = require("@octokit/core");
const fse = require('fs-extra')
const path = require('path')
const yaml = require('yaml');
const {
    readFileSync
} = require('fs-extra');

const engine = new Liquid({
    root: __dirname,
    extname: '.liquid'
})

function parseTemplate(path) {
    const fileData = fse.readFileSync(path, {
        encoding: 'utf8'
    })
    const chunks = fileData.split('---\n')
    if (chunks.length === 1) {
        console.log('-> No frontmatter found')
        return {
            yaml: null,
            template: chunks[0]
        }
    } else if (chunks[0] !== '') {
        const template = chunks.join('---\n')
        return {
            yaml: null,
            template: template
        }
    } else if (chunks.length >= 3 && chunks[0] === '') {
        const yml = chunks[1]
        const template = chunks.slice(2).join('---\n')
        return {
            yaml: yaml.parse(yml),
            template: template
        }
    } else {
        throw new Error('Invalid Template format')
    }
}

function getFiles(dirPath) {
    let finalFiles = []
    let list = fse.readdirSync(dirPath)
    list.map(item => path.join(dirPath, item))
        .forEach((file) => {
            if (fse.lstatSync(file).isDirectory()) {
                finalFiles = finalFiles.concat(getFiles(file))
            } else {
                finalFiles.push(file)
            }
        })
    return finalFiles
}

async function build(sourceDir, destDir) {
    /* Clear old build dir */
    fse.emptyDirSync(destDir)
    fse.copySync(sourceDir, destDir)

    let files = getFiles(destDir)

    /* list all blog paths */
    let blogPaths = new Set(
        files.filter(filepath => filepath.includes('_blog'))
            .map(filepath => path.join(filepath.split('_blog')[0], '_blog')))

    /* process each blog folder */
    const promises = Array(...blogPaths).map(processBlog)
    await Promise.all(promises)

    /* find all the liquid file (exclude liquid files inside _blog)*/
    const liquidFilePaths = files.filter(file => file.endsWith('liquid') && !file.includes('_blog'))

    /* Read global config yaml */
    const globalDataFile = fse.readFileSync('global.yaml', 'utf8')
    const globalData = yaml.parse(globalDataFile)

    /* Read global config yaml */
    const blogPosts = fse.readFileSync(path.join(destDir, 'blog', 'index.yml'), 'utf8')
    const blogPostsData = yaml.parse(blogPosts)

    for (let i = 0; i < liquidFilePaths.length; i++) {
        console.log('=> Template:', liquidFilePaths[i])
        const resp = parseTemplate(liquidFilePaths[i])
        const page = engine.renderSync(
            engine.parse(resp.template), {
                ...globalData,
                ...resp.yaml,
                blogPosts: blogPostsData
            })
        fse.writeFileSync(liquidFilePaths[i], page)
        fse.rename(liquidFilePaths[i], liquidFilePaths[i].replace('liquid', 'html'))
    }
}

async function processBlog(blogDir) {
    const layoutDir = path.join(blogDir, '_layout')
    const postsDir = path.join(blogDir, '_posts')
    const octokit = new Octokit();

    /* Read global config yaml */
    const globalDataFile = fse.readFileSync('global.yaml', 'utf8')
    const globalData = yaml.parse(globalDataFile)
    let posts = []

    const promises = getFiles(postsDir).map((postPath) => {

        const {
            yaml,
            template
        } = parseTemplate(postPath)
        
        if (!yaml || !template || Object.keys(yaml).length === 0) {
            console.log('=>', postPath, 'YAML declaration or template is empty')
            return
        }

        return octokit.request('POST /markdown/raw', {
            data: template,
            headers: {
                'content-type': 'text/plain; charset=utf-8'
            }
        }).then((resp) => {

            if (resp.status == 200) {
                const layout = (yaml.layout || 'default') + '.liquid'
                const layoutFileData = readFileSync(path.join(layoutDir, layout), 'utf8')
                const layoutPage = engine.renderSync(
                    engine.parse(layoutFileData), {
                        ...globalData,
                        ...yaml
                    }
                )
                const page = engine.renderSync(
                    engine.parse(resp.data), {
                        ...globalData,
                        ...yaml
                    }
                )
                const postFileName = yaml.title.replace(/\s+/gm, '_').replace(/[^a-zA-Z0-9_]/gm, '')
                fse.writeFileSync(
                    path.join(postsDir, postFileName + '.html'),
                    layoutPage.replace('<content/>', page)
                )
                fse.removeSync(postPath)
                posts.push({
                    ...yaml,
                    link: path.join('posts', postFileName+'.html'),
                    snapshot: page.replace(/<[^>]*>/gm, "").substring(0, 120)
                })
            }
        })
    })

    await Promise.all(promises)

    // sort posts by pubDate (latest first)
    posts = posts.sort((a, b) => 
        new Date(a.pubDate).valueOf() > new Date(b.pubDate).valueOf() ? -1 : 1)
    const indexFile = readFileSync(path.join(layoutDir, 'index.liquid'), 'utf8')
    const indexPage = engine.renderSync(
        engine.parse(indexFile), {
            ...globalData,
            posts
        }
    )
    fse.writeFileSync(path.join(blogDir, 'index.html'), indexPage)
    fse.writeFileSync(path.join(blogDir, 'index.yml'), yaml.stringify(posts))
    //console.log(indexPage)

    fse.removeSync(layoutDir)
    fse.renameSync(postsDir, postsDir.replace('_posts', 'posts'))
    fse.renameSync(blogDir, blogDir.replace('_blog', 'blog'))
}

function runDev(sourceDir, destDir) {
    build(sourceDir, destDir)
    fse.watch(sourceDir, {
        recursive: true
    }, (action, filepath) => {
        const sourceFile = path.join(sourceDir, filepath)
        const globalDataFile = fse.readFileSync('global.yaml', 'utf8')
        const globalData = yaml.parse(globalDataFile)

        if (filepath.endsWith('.liquid') && !filepath.includes('_blog')) {
            console.log('=> Rerendering Template:', sourceFile)
            const destFile = path.join(destDir, filepath)
                .replace('liquild', 'html')
                .replace('_', '')
            const resp = parseTemplate(sourceFile)
            const page = engine.renderSync(
                engine.parse(resp.template), {
                    ...globalData,
                    ...resp.yaml
                })
            fse.writeFileSync(destFile, page)
        } else if (filepath.endsWith('.liquid') && !filepath.includes('_blog')) {
            //console.log('=> Renendering blog')
            //processBlog(path.join(sourceFile.split('_blog')[0], '_blog'))
        } else {
            fse.copySync(
                path.join(sourceDir, filepath),
                path.join(destDir, filepath.replace('_', ''))
            )
        }
    })
}

/* self executing function */
(() => {
    if (process.argv[2] == '--watch' && process.argv[3] == '--serve')
        runDev('public', 'build')
    else
        build('public', 'build')
    return 'Process Completed..'
})()