/// <reference types="cypress" />


describe('Our first suite', () =>{

  beforeEach('Login to the app', () => {
    cy.intercept({method:'GET', path: 'tags'}, {fixture: 'tags.json'})
    cy.loginToApplication()
  })

  it('Should log in', () => {
    cy.log('Yeeey we logged in!')
  })

  it('Verify correct request and responce', () => {
    cy.intercept('POST', 'https://api.realworld.io/api/articles/').as('postArticles')

    cy.contains('New Article').click()
    cy.get('[formcontrolname="title"]').type('This is the First Article Title Ever')
    cy. get('[formcontrolname="description"]').type('This is my Description')
    cy. get('[formcontrolname="body"]').type('This is a Body of My Article')
    cy.contains('Publish Article').click()

    cy.wait('@postArticles').then( xhr => {
      console.log(xhr)
      expect(xhr.response.statusCode).to.equal(201)
      expect(xhr.request.body.article.body).to.equal('This is a Body of My Article')
      expect(xhr.response.body.article.description).to.equal('This is my Description')
    })
  })

  it('Intercepting and modifying the request and responce', () => {

    // cy.intercept('POST', '**/articles/', (req) => {
    //   req.body.article.description = "ThisThis is my Description 2"
    // }).as('postArticles')
    
    cy.intercept('POST', '**/articles/', (req) => {
      req.reply( res => {
        expect(res.body.article.description).to.equal('This is my Description')
        res.body.article.description = "ThisThis is my Description 2"
      })
    }).as('postArticles')

    cy.contains('New Article').click()
    cy.get('[formcontrolname="title"]').type('This is the First Article Title Ever')
    cy.get('[formcontrolname="description"]').type('This is my Description')
    cy.get('[formcontrolname="body"]').type('This is a Body of My Article')
    cy.contains('Publish Article').click()

    cy.wait('@postArticles')
    cy.get('@postArticles').then( xhr => {
      console.log(xhr)
      expect(xhr.response.statusCode).to.equal(201)
      expect(xhr.request.body.article.body).to.equal('This is a Body of My Article')
      expect(xhr.response.body.article.description).to.equal('ThisThis is my Description 2')
    })
  })

  it('Verify Popular Tags are displayed', () => {
    cy.get('.tag-list')
    .should('contain', 'cypress')
    .and('contain', 'automation')
    .and('contain', 'testing')
  })

  it('Verify Global Feed likes count', () => {
    cy.intercept('GET', 'https://api.realworld.io/api/articles/feed*', {"articles":[],"articlesCount":0})
    cy.intercept('GET', 'https://api.realworld.io/api/articles*', {fixture: 'articles.json'})

    cy.contains('Global Feed').click()
    cy.get('app-article-list button').then(heartList => {
      expect(heartList[0]).to.contain('1')
      expect(heartList[1]).to.contain('5')
    })

    cy.fixture('articles').then(file => {
      const articleLink = file.articles[1].slug
      file.articles[1].favoritesCount = 6
      cy.intercept('POST', 'https://api.realworld.io/api/articles/'+articleLink+'/favorite', file)
    })
    cy.get('app-article-list button').eq(1).click().should('contain', '6')
  })

  it.only('Delete a new Article in a global feed', () => {

    const userCredentials = {
      "user": {
          "email": "rinagorbaciova@gmail.com",
          "password": "Test_Password"
      }
    }
    const bodyRequest = {
      "article": {
          "title": "Request from API",
          "description": "API testing is easy",
          "body": "Angular is cool",
          "tagList": []
      }
    }
    cy.request('POST', 'https://api.realworld.io/api/users/login', userCredentials)
    .its('body').then(body => {
      const token = body.user.token

      cy.request({
        url: 'https://api.realworld.io/api/articles/',
        headers: { 'Authorization': 'Token '+token},
        method: 'POST',
        body: bodyRequest
      }).then( response => {
        expect(response.status).to.equal(201)
      })

      cy.contains('Global Feed').click()
      cy.get('.article-preview').first().click()
      cy.get('.article-actions').contains('Delete Article').click()
    })

  })
  
})

//next lesson Section 6: 40
