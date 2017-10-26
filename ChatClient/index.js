import { AppRegistry } from 'react-native';
import { StackNavigator } from 'react-navigation';

import HomeScreen from './App';
import ChatScreen from './ChatView';

export const Route = StackNavigator({
  Home: {
      screen: HomeScreen,
      navigationOptions :{
          header: null
        }
  },
  Chat:{
    screen:ChatScreen,
    navigationOptions: ({navigation}) => ({
       title: `Room - ${navigation.state.params.roomId}`,
     }),
  }
});

AppRegistry.registerComponent('ChatClient', () => Route);
