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
    async ->
      div = document.createElement 'div'
      document.body.appendChild div
      document.body.removeChild div
      async ->
        Boa._handleMutation.should.have.been.calledTwice
        done()
  it 'should have a setProperty method', (done) ->
    div = document.createElement 'div'
    div.classList.add 'set-prop-test'
    document.body.appendChild div
    Boa.setProperty '.set-prop-test', 'color', 'red'
    async ->
      getComputedStyle div
        .getPropertyValue 'color'
        .should.equal 'rgb(255, 0, 0)'
      done()

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
      .should.equal '40px'
    Boa.source '.test', 'boa:clientTop'
      .value()
      .should.equal '20px'

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

describe 'Custom Properties', ->
  it 'should allow custom property definitions', ->
    Boa.defineProperty.should.exist.and.be.a 'function'
    Boa.defineProperty
      .should.throw Error
    (-> Boa.defineProperty 'testProp', true, (e) -> e.value)
      .should.not.throw Error
    (-> Boa.defineProperty 'testProp', true, (e) -> e.value)
      .should.throw Error
  it 'should trigger updates on add/remove DOM elements', (done) ->
    div = document.createElement 'div'
    div.id = 'reflow-test'
    document.body.appendChild div
    extra = document.createElement 'div'
    extra.innerHTML = 'test'
    source = Boa.source '#reflow-test', 'boa:clientTop'
    source.bindTo '#reflow-test', 'margin-left'
    before = source.value()
    document.body.insertBefore extra, div
    async ->
      debugger
      after = source.value()
      before.should.not.equal after
      getComputedStyle div
        .getPropertyValue 'margin-left'
        .should.equal after
      done()

describe 'Custom Transformations', ->
  it 'should allow custom transform definitions', ->
    Boa.defineTransform.should.exist.and.be.a 'function'
    Boa.defineTransform
      .should.throw Error
    (-> Boa.defineTransform 345, (v, a) -> Math.pow(v,a))
      .should.throw Error
    (-> Boa.defineTransform 'exponent', 54)
      .should.throw Error
    (-> Boa.defineTransform 'plus', (v, a) -> v + a)
      .should.throw Error
    (-> Boa.defineTransform 'exponent', (v, a) -> Math.pow(v,a))
      .should.not.throw Error
  it 'should still return a source', ->
    source = Boa.source('#transform-test', 'width')
    transformed = source.plus 5
    transformed.should.be.an.instanceof Boa.Source
  it 'should be chainable', ->
    div = document.createElement 'div'
    div.id = 'transform-test'
    div.style.width = '40px'
    document.body.appendChild div
    source = Boa.source('#transform-test', 'width')
    source.plus(5).times(2).value().should.equal '90px'
    document.body.removeChild div
  it 'should accept other sources as input', ->
    div = document.createElement 'div'
    div.id = 'transform-test'
    div.style.width = '40px'
    div.style.height = '20px'
    document.body.appendChild div
    source = Boa.source('#transform-test', 'width')
    source2 = Boa.source('#transform-test', 'height')
    source.plus(source2).value().should.equal '60px'
    document.body.removeChild div

describe 'Predefined Properties', ->
  it 'should predefine some custom properties', ->
    (-> Boa.defineProperty 'clientLeft', true, (e) -> e.getBoundingClientRect().left)
      .should.throw Error
    (-> Boa.defineProperty 'clientTop', true, (e) -> e.getBoundingClientRect().top)
      .should.throw Error

describe 'Predefined Transforms', ->
  div = null
  before ->
    div = document.createElement 'div'
    div.id = 'transform-test'
    div.style.width = '40px'
    div.style.backgroundColor = '#accede'
    div.style.color = 'rgba(136, 136, 136, .5)'
    document.body.appendChild div
  describe 'Math', ->
    source = null
    before ->
      source = Boa.source('#transform-test', 'width')
    it 'should include plus', ->
      Boa.Source.prototype.plus.should.exist.and.be.a 'function'
      plusTest = source.plus 5
      plusTest.value().should.equal '45px'
    it 'should include minus', ->
      Boa.Source.prototype.minus.should.exist.and.be.a 'function'
      minusTest = source.minus 5
      minusTest.value().should.equal '35px'
    it 'should include times', ->
      Boa.Source.prototype.times.should.exist.and.be.a 'function'
      timesTest = source.times 5
      timesTest.value().should.equal '200px'
    it 'should include divided by', ->
      Boa.Source.prototype.dividedBy.should.exist.and.be.a 'function'
      dividedByTest = source.dividedBy 5
      dividedByTest.value().should.equal '8px'
    it 'should include mod', ->
      Boa.Source.prototype.mod.should.exist.and.be.a 'function'
      modTest = source.mod 5
      modTest.value().should.equal '0px'
  describe 'Color', ->
    source = source2 = null
    before ->
      source = Boa.source('#transform-test', 'background-color')
      source2 = Boa.source('#transform-test', 'color')
    it 'should include lighten', ->
      Boa.Source.prototype.lighten.should.exist.and.be.a 'function'
      lightenTest = source.lighten .2
      lightenTest.value().should.equal 'rgb(244, 249, 251)'
      lightenTest2 = source2.lighten .2
      lightenTest2.value().should.equal 'rgb(187, 187, 187)'
    it 'should include darken', ->
      Boa.Source.prototype.darken.should.exist.and.be.a 'function'
      darkenTest = source.darken .2
      darkenTest.value().should.equal 'rgb(99, 162, 192)'
      darkenTest2 = source2.darken .2
      darkenTest2.value().should.equal 'rgb(85, 85, 85)'
    it 'should include hue shifts', ->
      Boa.Source.prototype.shiftHue.should.exist.and.be.a 'function'
      hueShiftTest = source.shiftHue 45
      hueShiftTest.value().should.equal 'rgb(175, 172, 222)'
  after ->
    document.body.removeChild div
