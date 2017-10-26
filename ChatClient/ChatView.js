import React, { Component } from 'react';
import { Text, View, StyleSheet, ScrollView, KeyboardAvoidingView, TextInput, TouchableHighlight, Keyboard, Alert } from 'react-native';
import KeyboardSpacer from 'react-native-keyboard-spacer';
import AutogrowInput from 'react-native-autogrow-input';
import { NavigationActions } from 'react-navigation'
import SocketIOClient from 'socket.io-client';
import _ from "lodash";

const uuidv1 = require('uuid/v1');
const ioServerURL = 'http://192.168.1.118:3000';
const socketNamespace = 'action';
//used to make random-sized messages
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// The actual chat view itself- a ScrollView of BubbleMessages, with an InputBar at the bottom, which moves with the keyboard
export default class ChatView extends Component {

  constructor(props) {
    super(props);

    var messages = [];

    this.state = {
      messages: messages,
      inputBarText: '',
      roomId:this.props.navigation.state.params.roomId,
      token:this.props.navigation.state.params.token,
      username:'',
      isNotYetJoin:false
    }

    this.socket = SocketIOClient(ioServerURL);

    this.socket.on('connect',this._onConnected)
    this.socket.on('disconnect', function (reason) {
      console.log(reason);
    });

    this.socket.on('reconnect', function() {alert('reconnect')} ); // connection restored
    // this.socket.on('reconnect_failed', function() { console.log("Reconnect failed"); });

    this.socket.on(socketNamespace, this._onReceivedMessage);
    this.socket.on('error',this._onErrorMessage);

  }

  static navigationOptions = {
    title: 'Chat',
  };

  //fun keyboard stuff- we use these to get the end of the ScrollView to "follow" the top of the InputBar as the keyboard rises and falls
  componentWillMount () {
    this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this.keyboardDidShow.bind(this));
    this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this.keyboardDidHide.bind(this));
  }

  componentWillUnmount() {
    var data = {
                  type:'server/leave',
                  data:{
                      roomId:this.state.roomId,
                      token:this.state.token,
                      username:this.state.username
                    }
                };
    this.socket.emit(socketNamespace,{data:data});
    this.keyboardDidShowListener.remove();
    this.keyboardDidHideListener.remove();
  }

  //When the keyboard appears, this gets the ScrollView to move the end back "up" so the last message is visible with the keyboard up
  //Without this, whatever message is the keyboard's height from the bottom will look like the last message.
  keyboardDidShow (e) {
    this.scrollView.scrollToEnd();
  }

  //When the keyboard dissapears, this gets the ScrollView to move the last message back down.
  keyboardDidHide (e) {
    this.scrollView.scrollToEnd();
  }

  //scroll to bottom when first showing the view
  componentDidMount() {
    setTimeout(function() {
      this.scrollView.scrollToEnd();
    }.bind(this))
  }

  //this is a bit sloppy: this is to make sure it scrolls to the bottom when a message is added, but
  //the component could update for other reasons, for which we wouldn't want it to scroll to the bottom.
  componentDidUpdate() {
    setTimeout(function() {
      this.scrollView.scrollToEnd();
    }.bind(this))
  }

  _onConnected=()=>{
    var data = {
      type:'server/join',
      data:{
          roomId:this.state.roomId,
          token:this.state.token
        }
      };
    this.socket.emit(socketNamespace,{data:data});
  }

  _onReceivedMessage=(payload)=>{
    console.log(payload);

    switch (payload.type) {
      case 'server/comment':
        this.state.messages.push({
          direction: "left",
          text: payload.message.text,
          username:payload.message.username
        });
        break;
      case 'server/unauthorized':
        Alert.alert(
          'Unauthorized User',
          'sorry',
          [
            {text: 'OK', onPress: () => this.props.navigation.goBack()},
          ],
          { cancelable: false }
        )

        break;
      case 'server/join':
        this.state.messages.push({
          direction: 'center',
          text: payload.data.username + ' is joined'
        });
        if(!this.state.isNotYetJoin){
          this.setState({
            username: payload.data.username,
            isNotYetJoin:true
          });
        }

        break;
      case 'server/leave':
        this.state.messages.push({
          direction: 'center',
          text: payload.data.username + ' is leaved'
        });
        break;
      default:
        console.log(payload);
    }


    this.setState({
      messages: this.state.messages
    });


  }

  _onErrorMessage = (msg)=>{
    alert(msg);
  }

  _sendMessage=()=>{

    //empty text filter
    if(!this.state.inputBarText || !this.state.inputBarText.length){
      return;
    }
     Keyboard.dismiss();
    var message = {id:uuidv1(),text: this.state.inputBarText};
    this.state.messages.push(message);
    message.username = this.state.username;
    var data = {
      type:'server/comment',
      data:{
          message,
          roomId:this.state.roomId,
          token:this.state.token,
        }
      };
    this.socket.emit(socketNamespace,{data:data},
      this._callbackMessage
    );

    message.direction = "right";
    message.sent = false;
    this.setState({
      messages: this.state.messages,
      inputBarText: ''
    });
  }

  _callbackMessage=(status)=>{
    console.log(status);
    var messages = _.reduce(this.state.messages,function(messages,msg,index){
                if(msg.id === status.messageId){
                  console.log(msg);
                  msg.sent = true;
                }
                messages.push(msg);
                return messages;
              },[]);
    this.setState({messages:messages});
  }

  _onChangeInputBarText(text) {
    this.setState({
      inputBarText: text
    });
  }

  //This event fires way too often.
  //We need to move the last message up if the input bar expands due to the user's new message exceeding the height of the box.
  //We really only need to do anything when the height of the InputBar changes, but AutogrowInput can't tell us that.
  //The real solution here is probably a fork of AutogrowInput that can provide this information.
  _onInputSizeChange() {
    setTimeout(function() {
      this.scrollView.scrollToEnd({animated: false});
    }.bind(this))
  }

  render() {

    var messages = [];

    this.state.messages.forEach(function(message, index) {
      messages.push(
          <MessageBubble key={index} direction={message.direction} text={message.text} sent={message.sent} username={message.username}/>
        );
    });

    return (
              <View style={styles.outer}>
                  <ScrollView ref={(ref) => { this.scrollView = ref }} style={styles.messages}>
                    {messages}
                  </ScrollView>
                  <InputBar onSendPressed={() => this._sendMessage()}
                            onSizeChange={() => this._onInputSizeChange()}
                            onChangeText={(text) => this._onChangeInputBarText(text)}
                            text={this.state.inputBarText}/>

              </View>
            );
  }
}

//The bubbles that appear on the left or the right for the messages.
class MessageBubble extends Component {
  render() {

    if(this.props.direction === 'center'){
      var leftSpacer = <View style={{width: 70}}/>;
      var rightSpacer = <View style={{width: 70}}/>;
      var bubbleStyles = styles.messageJoin;
      var bubbleTextStyle =styles.messageBubbleTextJoin;
    }else{
      //These spacers make the message bubble stay to the left or the right, depending on who is speaking, even if the message is multiple lines.
      var leftSpacer = this.props.direction === 'left' ? null : <View style={{width: 70}}/>;
      var rightSpacer = this.props.direction === 'left' ? <View style={{width: 70}}/> : null;

      var bubbleStyles = this.props.direction === 'left' ? [styles.messageBubble, styles.messageBubbleLeft] : [styles.messageBubble, styles.messageBubbleRight];

      var bubbleTextStyle = this.props.direction === 'left' ? styles.messageBubbleTextLeft : styles.messageBubbleTextRight;
    }


    return (
        <View style={{justifyContent: 'space-between', flexDirection: 'row'}}>
            {leftSpacer}
            <View style={bubbleStyles}>
              <View style={{flexDirection:'column'}}>
                {
                  this.props.username && this.props.direction=='left' &&
                  <Text style={styles.usernameText}>{this.props.username}</Text>
                }
                <Text style={[bubbleTextStyle]}>
                  {this.props.text}
                </Text>
              </View>
              {
                !this.props.sent && this.props.direction=== 'right' &&
                <Text style={styles.notSendText}>Message not send</Text>
              }

            </View>
            {rightSpacer}
          </View>
      );
  }
}

//The bar at the bottom with a textbox and a send button.
class InputBar extends Component {

  //AutogrowInput doesn't change its size when the text is changed from the outside.
  //Thus, when text is reset to zero, we'll call it's reset function which will take it back to the original size.
  //Another possible solution here would be if InputBar kept the text as state and only reported it when the Send button
  //was pressed. Then, resetInputText() could be called when the Send button is pressed. However, this limits the ability
  //of the InputBar's text to be set from the outside.
  componentWillReceiveProps(nextProps) {
    if(nextProps.text === '') {
      this.autogrowInput.resetInputText();
    }
  }

  render() {
    return (
          <View style={styles.inputBar}>
            <AutogrowInput style={styles.textBox}
                        ref={(ref) => { this.autogrowInput = ref }}
                        multiline={true}
                        defaultHeight={50}
                        onChangeText={(text) => this.props.onChangeText(text)}
                        onContentSizeChange={this.props.onSizeChange}
                        value={this.props.text}/>
            <TouchableHighlight style={styles.sendButton} onPress={() => this.props.onSendPressed()}>
                <Text style={{color: 'white'}}>Send</Text>
            </TouchableHighlight>
          </View>
          );
  }
}

//TODO: separate these out. This is what happens when you're in a hurry!
const styles = StyleSheet.create({

  //ChatView

  outer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    backgroundColor: 'white'
  },

  messages: {
    flex: 1
  },

  //InputBar

  inputBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
    paddingVertical: 3,
  },

  textBox: {
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'gray',
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 10
  },

  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 15,
    marginLeft: 5,
    paddingRight: 15,
    borderRadius: 5,
    backgroundColor: '#66db30'
  },

  //MessageBubble

  messageBubble: {
      borderRadius: 5,
      marginTop: 8,
      marginRight: 10,
      marginLeft: 10,
      paddingHorizontal: 10,
      paddingVertical: 5,
      flexDirection:'row',
      flex: 1,
      minWidth:20
  },

  messageBubbleLeft: {
    backgroundColor: '#d5d8d4',
  },

  messageBubbleTextLeft: {
    color: 'black'
  },

  messageBubbleRight: {
    backgroundColor: '#66db30',
  },

  messageBubbleTextRight: {
    color: 'white',
  },

  messageJoin:{
    borderRadius: 5,
    backgroundColor:'#D3D3D3',
    margin:5,
    padding:10
  },

  messageBubbleTextJoin:{
    color:'black',
    fontSize:12,
    fontStyle:'italic'
  },

  usernameText:{
    fontWeight:'bold',
    marginBottom:2,
    fontSize:16
  },

  notSendText:{
    fontStyle:'italic',
    fontSize:12,
    color:'red',
    paddingLeft:10
  }
})
