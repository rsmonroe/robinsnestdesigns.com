import Col from 'react-bootstrap/Col'
import Form from 'react-bootstrap/Form'
import UploadFileToAWS from '../../components/UploadFileToAWS'

export default () => <Col>
  <h1>Upload Image to S3</h1>
  <hr />
  <Form onSubmit={(evt) => evt.preventDefault()}>
    <UploadFileToAWS />
  </Form>
</Col>
