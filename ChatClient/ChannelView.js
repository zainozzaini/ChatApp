import React, { Component } from 'react';
import {
  View,
  ScrollView,
  Text,
  TextInput,
  StyleSheet,
  Button,
  Dimensions,
  KeyboardAvoidingView,
  Keyboard
} from 'react-native';

var {height, width} = Dimensions.get('window');

export default class ChannelView extends Component {

  static navigationOptions = {
    title: 'Homefdf',
  }

  constructor(props){
    super(props);
    this.state = {
      roomId:'',
      token:''
    }
  }


  _gotoChat=()=>{
    if(this.state.roomId&&this.state.roomId.length){
      this.props.navigation.navigate('Chat',{
          roomId:this.state.roomId,
          token:this.state.token,
        });
      Keyboard.dismiss();
      return;
    }

    alert('Please set Room Id');
  }

  render(){

    return(
        <View  style={styles.container}>
            <KeyboardAvoidingView  behavior="padding" keyboardVerticalOffset={150}>
              <View style={styles.roomContainer}>
                <Text>Room Id:</Text>
                <TextInput
                  onChangeText={(text) => this.setState({roomId:text})}
                />
                <Text>Token Access:</Text>
                <TextInput
                  onChangeText={(text) => this.setState({token:text})}
                />
                <View style={{marginTop:20}}/>
                <Button
                  title="Set"
                  onPress={this._gotoChat}
                />
              </View>
            </KeyboardAvoidingView>
        </View>
    );
  }
}

const styles = StyleSheet.create({
  container:{
    height:height,
    width:width,
    justifyContent:'center',

  },
  roomContainer:{
    marginLeft:50,
    marginRight:50,
    justifyContent:'center',
  }

});
