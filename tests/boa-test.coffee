async = (f) -> setTimeout f, 0

describe 'Boa', ->
  it 'should exist', ->
    Boa.should.exist.and.be.an 'object'
  it 'should have a source() method', ->
    Boa.source.should.exist.and.be.a 'function'
  it 'should have appended a style element into the document head', ->
    Boa._style.should.exist
    Boa._style.parentNode.should.equal document.head
  it 'should be listening for DOM mutations', (done) ->
    sinon.spy Boa, '_handleMutation'
    div = document.createElement 'div'
    async ->
      document.body.appendChild div
      document.body.removeChild div
      async ->
        Boa._handleMutation.should.have.been.calledTwice
        done()
  it 'should allow custom property definitions', ->
    Boa.defineProperty.should.exist.and.be.a 'function'
    Boa.defineProperty
      .should.throw Error
    (-> Boa.defineProperty 'testProp', (e) -> e.value)
      .should.not.throw Error
    (-> Boa.defineProperty 'testProp', (e) -> e.value)
      .should.throw Error
  it 'should predefine some custom properties', ->
    (-> Boa.defineProperty 'clientLeft', (e) -> e.getBoundingClientRect().left)
      .should.throw Error
    (-> Boa.defineProperty 'clientTop', (e) -> e.getBoundingClientRect().top)
      .should.throw Error

describe 'Boa.Source', ->
  it 'should exist', ->
    Boa.Source.should.exist.and.be.a 'function'
  it 'should be returned from Boa.source()', ->
    Boa.source().should.be.an.instanceof Boa.Source
    (-> Boa.source '#test', '::')
      .should.throw Error
  it 'should have a bindTo method', ->
    Boa.source().bindTo.should.exist.and.be.a 'function'
  it 'should be exactly equal to any matching source', ->
    a = Boa.source '#test', 'color'
    b = Boa.source '#test', 'color'
    a.should.equal b
  it 'should have a value() method', ->
    div = document.createElement 'div'
    div.style.color = 'rgb(250, 200, 128)'
    div.classList.add 'test'
    document.body.appendChild div
    test = Boa.source '.test', 'color'
    test.value().should.equal 'rgb(250, 200, 128)'
    document.body.removeChild div
  it 'should allow sourcing of custom properties', ->
    div = document.createElement 'div'
    div.style.position = 'absolute'
    div.style.left = '40px'
    div.style.top = '20px'
    div.classList.add 'test'
    document.body.appendChild div
    Boa.source '.test', 'boa:clientLeft'
      .value()
      .should.equal 40
    Boa.source '.test', 'boa:clientTop'
      .value()
      .should.equal 20

  describe 'Boa.Source#bindTo', ->
    div1 = div2 = null
    before ->
      div1 = document.createElement 'div'
      div1.classList.add 'test1'
      div1.style.height = '50px'
      div2 = document.createElement 'div'
      div2.classList.add 'test2'
      document.body.appendChild div1
      document.body.appendChild div2
      Boa.source '.test1', 'height'
        .bindTo '.test2', 'height'
    it 'should add a style rule', (done) ->
      async ->
        getComputedStyle div2
          .getPropertyValue 'height'
          .should.equal '50px'
        done()
    it 'should maintain the rule', (done) ->
      div1.style.height = '100px'
      async ->
        getComputedStyle div2
          .getPropertyValue 'height'
          .should.equal '100px'
        done()
    it 'should handle multiple, chained bindings', (done) ->
      Boa.source '.test2', 'color'
        .bindTo '.test1', 'background-color'
      Boa.source '.test1', 'background-color'
        .bindTo '.test2', 'background-color'
      div3 = document.createElement 'div'
      div3.classList.add 'test3'
      document.body.appendChild div3
      Boa.source '.test2', 'background-color'
        .bindTo '.test3', 'color'
      div2.style.color = 'red'
      async ->
        getComputedStyle div1
          .getPropertyValue 'background-color'
          .should.equal 'rgb(255, 0, 0)'
        getComputedStyle div2
          .getPropertyValue 'background-color'
          .should.equal 'rgb(255, 0, 0)'
        getComputedStyle div3
          .getPropertyValue 'color'
          .should.equal 'rgb(255, 0, 0)'
        document.body.removeChild div3
        done()
    after ->
      document.body.removeChild div1
      document.body.removeChild div2

describe 'Boa.Binding', ->
  it 'should exist', ->
    Boa.Binding.should.exist.and.be.a 'function'
  it 'should be returned from Boa.Source#bindTo', ->
    div1 = document.createElement 'div'
    div1.classList.add 'test1'
    div1.style.height = '50px'
    div2 = document.createElement 'div'
    div2.classList.add 'test2'
    document.body.appendChild div1
    document.body.appendChild div2
    binding = Boa.source '.test1', 'height'
      .bindTo '.test2', 'height'
    document.body.removeChild div1
    document.body.removeChild div2
    binding.should.be.an.instanceof Boa.Binding
