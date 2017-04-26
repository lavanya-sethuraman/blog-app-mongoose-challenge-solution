const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const should = chai.should();


const {BlogPost} = require('../models');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);

function seedBlogData() {
  console.info('seeding blog data');
  const seedData = [];

  for (let i=1; i<=10; i++) {
    seedData.push(generateBlogData());
  }
  
  return BlogPost.insertMany(seedData);
}


function generateBlogData() {
  return {
    title: faker.Company.companyName(),
    author: {
    	firstName:faker.Name.firstName(),
    	lastName:faker.Name.lastName()
    },
    content: faker.Lorem.sentence()
  }
}

function tearDownDb() {
    console.warn('Deleting database');
    return mongoose.connection.dropDatabase();
}

describe('Blogs API resource', function() {

  
  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function() {
    return seedBlogData();
  });

  afterEach(function() {
    return tearDownDb();
  });

  after(function() {
    return closeServer();
  })
});

describe('GET endpoint', function() {

    it('should return all existing blogs', function() {
      
      let res;
      return chai.request(app)
        .get('/posts')
        .then(function(_res) {
          res = _res;
          res.should.have.status(200);
          res.body.posts.should.have.length.of.at.least(1);
          return BlogPost.count();
        })
        .then(function(count) {
          res.body.posts.should.have.length.of(count);
        });
    });


    it('should return blogs with right fields', function() {

      let resBlog;
      return chai.request(app)
        .get('/posts')
        .then(function(res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.posts.should.be.a('array');
          res.body.posts.should.have.length.of.at.least(1);

          res.body.posts.forEach(function(blog) {
            blog.should.be.a('object');
            blog.should.include.keys(
              'id', 'title', 'author', 'content');
          });
          resBlog = res.body.posts[0];
          return BlogPost.findById(resBlog.id);
        })
        .then(function(blog) {

          resBlog.id.should.equal(blog.id);
          resBlog.title.should.equal(blog.title);
          resBlog.author.should.equal(blog.author);
          resBlog.content.should.equal(blog.content);
        });
    });
  });

describe('POST endpoint', function() {
    
    it('should add a new blog', function() {

      const newBlog = generateBlogData();

      return chai.request(app)
        .post('/posts')
        .send(newBlog)
        .then(function(res) {
          res.should.have.status(201);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.include.keys(
            'id', 'title', 'author', 'content');
          res.body.title.should.equal(newBlog.title);
          res.body.id.should.not.be.null;
          res.body.author.firstName.should.equal(newBlog.author.firstName);
          res.body.author.lastName.should.equal(newBlog.author.lastName);
          res.body.content.should.equal(newBlog.content);
          return BlogPost.findById(res.body.id);
        })
        .then(function(blog) {
          blog.title.should.equal(newBlog.title);
          blog.author.firstName.should.equal(newBlog.author.firstName);
          blog.author.lastName.should.equal(newBlog.author.lastName);
          blog.content.should.equal(newBlog.content);
        });
    });
  });

describe('DELETE endpoint', function() {
    
    it('delete a blog by id', function() {

      let blog;

      return BlogPost
        .findOne()
        .exec()
        .then(function(_blog) {
          blog = _blog;
          return chai.request(app).delete(`/posts/${blog.id}`);
        })
        .then(function(res) {
          res.should.have.status(204);
          return B.findById(blog.id).exec();
        })
        .then(function(_blog) {
          should.not.exist(_blog);
        });
    });
  });


describe('PUT endpoint', function() {

    it('should update fields you send over', function() {
      const updateData = {
        title: 'Tom',
        content: 'adfhjaodkflnaioeio'
      };

      return BlogPost
        .findOne()
        .exec()
        .then(function(blog) {
          updateData.id = blog.id;

          return chai.request(app)
            .put(`/posts/${blog.id}`)
            .send(updateData);
        })
        .then(function(res) {
          res.should.have.status(204);

          return blog.findById(updateData.id).exec();
        })
        .then(function(blog) {
          blog.title.should.equal(updateData.title);
          blog.content.should.equal(updateData.content);
        });
      });
  });

 
