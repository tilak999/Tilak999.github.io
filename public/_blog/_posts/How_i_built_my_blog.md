---
title: How I built my own static CMS blog
pubDate: 2020-07-10 01:30
Author: Tilak Sasmal
featureImage: https://images.unsplash.com/photo-1508780709619-79562169bc64?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1050&q=80
---

Building a CMS system was always on my TODO list and recently I decided to to a makeover of my portfolio site. I wanted my portfolio site to also host my blog but there are a few options for using GitHub pages as static CMS, so my options were either to use Jekyll or use any modern SPA framework. 

Using Jekyll:

*Pros*
- Static server-side rendered pages
- Don't need any javascript to bind stuff
- Easy and faster to iterate

*Cons*
- Written in Ruby so I would need to install and setup ruby.
- Limited Customisation

Using SPA frameworks like Vuepress or Next.js or Hugo

*Pros*
- Awesome build tools and development flexibility
- Customisation and extensibility

*Cons*
- Complex project structure
- Harder to set up an automated build system

I wanted to have a system which I could extend as and when required and also, easy to understand and customize. So finally, I decided why not build my own CMS system. It won't be shiny, flashy loaded with features. It would teach me a lot in terms of the blogging system and how it works.

I started with mimicking the structure and functionality of Jekyll using node. I have used YAML and liquidjs for composing my templates and HTML views. Then I scripted the data injection and composition logic for rendering the final output HTML files.

This is how my blog post template look like. In the top section of template i can have data elements which will be used by build script to render post `Title`, `Image`, `Publish Date` and `post URL`. We can have as many attributes as required. Also I can reference these attributes from the post content as well.

```
---
title: How I built my own static CMS blog
pubDate: 2020-07-10 01:30
Author: Tilak Sasmal
featureImage: https://images.unsplash.com/photo-1594012487062-cfdf01df1d12?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1050&q=80
---

Building a CMS system was always on my TODO list and recently I 
decided to to a makeover of my portfolio site. I wanted my portfolio...
```

checkout the source at https://github.com/Tilak999/Tilak999.github.io
