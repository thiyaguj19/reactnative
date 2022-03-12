import React, { Component } from 'react';
import { Text, View, FlatList, ScrollView,
  Modal, Button, StyleSheet, Alert,
  PanResponder } from 'react-native';
import { Card, Icon, Rating, Input  } from 'react-native-elements';
import { connect } from 'react-redux';
import { baseUrl } from '../shared/baseUrl';
import { postFavorite } from '../redux/ActionCreators';
import { postComment } from '../redux/ActionCreators';
import * as Animatable from 'react-native-animatable';

const mapStateToProps = state => {
  return {
    comments : state.comments,
    campsites : state.campsites,
    favorites: state.favorites
  }
}

const mapDispatchToProps = {
  postFavorite: campsiteId => (postFavorite(campsiteId)),
  postComment: (campsiteId, rating, author, text) => postComment(campsiteId, rating, author, text),
};

function RenderCampsite(props) {

    const {campsite} = props;
    const view = React.createRef();
    const recognizeDrag = ({dx}) => (dx < -200) ? true : false;
    const recognizeComment = ({dx}) => (dx > 200) ? true : false;
    console.log("recognizeDrag: " + recognizeDrag);
    console.log("recognizeComment: " + recognizeComment);

    const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        view.current.rubberBand(1000)
        .then(endState => console.log(endState.finished ? 'finished' : 'canceled'));
      },
      onPanResponderEnd: (e, gestureState) => {
        console.log('pan responder end', gestureState);
        if (recognizeDrag(gestureState)) {
          Alert.alert(
            'Add Favorite',
            'Are you sure you wish to add ' + campsite.name + ' to favorites?',
            [
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => console.log("Cancel Pressed")
              },
              {
                text: 'OK',
                onPress: () => props.favorite ? console.log('Already set as a favorite') : props.markFavorite()
              }
            ],
            { canceable: false }
          );
        } else if (recognizeComment (gestureState)) {
          props.onShowModal();
        }
        return true;
      },
    });

    if (campsite) {

        return (
          <Animatable.View
            ref={view}
            animation='fadeInDown'
            duration={12000}
            delay={1000}
            {...panResponder.panHandlers}
          >
            <Card
                featuredTitle = {campsite.name}
                image={{ uri : baseUrl + campsite.image }}
            >
                <Text style={{margin:10}}>
                    {campsite.description}
                </Text>
                <View style={styles.cardRow}>
                  <Icon
                    name={ props.favorite ? "heart" : "heart-o" }
                    type="font-awesome"
                    color="#f50"
                    raised
                    reverse
                    onPress={ () => props.markFavorite()}
                  />
                  <Icon
                    name="pencil"
                    type="font-awesome"
                    color="#5637DD"
                    raised
                    reverse
                    onPress={ () => props.onShowModal()}
                  />
                </View>
            </Card>
          </Animatable.View>
        );
    }
    return <View/>
}

function RenderComment({comments}) {

  const renderCommentItem = ({item}) => {
    return (
      <Animatable.View 
        animation='fadeInUp' duration={12000} delay={1000}>
        <View style={{ margin: 10}}>
          <Text style={{fontSize : 14}}> {item.text}</Text>
          <Rating
            startingValue={item.rating}
            imageSize={10}
            style={{paddingVertical: '5%', alignItems: 'flex-start'}}
            readonly
          />
          <Text style={{fontSize : 12}}> {`--${item.author}, ${item.date}`}</Text>
        </View>
      </Animatable.View>
    );
  }

  return (
    <Card title='Comments'>
      <FlatList
        data={comments}
        renderItem={renderCommentItem}
        keyExtractor={item => item.id.toString()}
      />
    </Card>
  );
}

class CampsiteInfo extends Component {

    constructor(props) {
      super(props);
      this.state = {
        showModal : false,
        rating: 5,
        author: '',
        text: ''
      };
    }

    static navigationOptions = {
        title: 'Campsite Information'
    }

    toggleModal () {
      this.setState ( {showModal: !this.state.showModal});
    }

    handleComment(campsiteId) {
      this.props.postComment(campsiteId, this.state.rating,
        this.state.author, this.state.text);
    }

    resetForm() {
      this.setState( {
        showModal : false,
        rating: 5,
        author: '',
        text: ''
      });
    }

    markFavorite (campsiteId) {
      this.props.postFavorite(campsiteId);
    }

    render() {
      const campsiteId = this.props.navigation.getParam('campsiteId');
      const campsite = this.props.campsites.campsites.filter(campsite => campsite.id === campsiteId)[0];
      const comments = this.props.comments.comments.filter(comment=>comment.campsiteId === campsiteId);
      return (
          <ScrollView>
            <RenderCampsite
              campsite={campsite}
              favorite={this.props.favorites.includes(campsiteId)}
              markFavorite={()=>this.markFavorite(campsiteId)}
              onShowModal={() => this.toggleModal()}
            />
            <RenderComment comments={comments} />
            <Modal
               animationType={'slide'}
               transparent={false}
               visible={this.state.showModal}
               onRequestClose={() => this.toggleModal()}
            >
              <View style={styles.modal}>
                <Rating
                  showRating
                  startingValue={this.state.rating}
                  imageSize={40}
                  onFinishRating={rating => this.setState({rating: rating})}
                  style={{paddingVertical: 10}}
                />
                <Input
                  placeholder='Author'
                  leftIcon='user-o'
                  leftIconContainerStyle={{padding: 10}}
                  onChangeText={value => this.setState({author: value})}
                />
                <Input
                  placeholder='Comment'
                  leftIcon='comment-o'
                  leftIconContainerStyle={{padding: 10}}
                  onChangeText={value => this.setState({text: value})}
                />
                <View>
                  <Button
                    onPress={() => {
                      this.handleComment(campsiteId);
                      this.resetForm();
                    }}
                    title='Submit'
                    color='#5637DD'
                  />
                </View>
                <View style={{margin: 10}}>
                  <Button
                    onPress={() => this.toggleModal()}
                    title='Cancel'
                    color='#808080'
                  />
                </View>
              </View>
            </Modal>
          </ScrollView>
      );
    }
}

const styles = StyleSheet.create(
  {
    cardRow : {
      alignItems: 'center',
      justifyContent : 'center',
      flex: 1,
      flexDirection: 'row',
      margin: 20
    },
    modal : {
      justifyContent : 'center',
      margin: 20
    }
  }
);

export default connect(mapStateToProps, mapDispatchToProps)(CampsiteInfo);
