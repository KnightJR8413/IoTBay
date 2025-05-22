from database import db

class Shipment(db.Model):
    __tablename__ = 'shipment'
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.String, nullable=False)
    shipment_method = db.Column(db.String, nullable=False)
    shipment_date = db.Column(db.DateTime, nullable=False)
    address = db.Column(db.String, nullable=False)
